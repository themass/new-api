package service

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/model"
)

var ErrReplayPayloadTooLarge = errors.New("replay payload too large")

const maxReplayPayloadBytes = 25 * 1024 * 1024

type ReplayUploadInput struct {
	Id          string          `json:"id"`
	Title       string          `json:"title"`
	OriginUrl   string          `json:"originUrl"`
	DurationMs  int64           `json:"durationMs"`
	Viewport    json.RawMessage `json:"viewport"`
	Events      json.RawMessage `json:"events"`
	RrwebEvents json.RawMessage `json:"rrwebEvents"`
}

type ReplayPayload struct {
	Id          string          `json:"id"`
	Title       string          `json:"title"`
	OriginUrl   string          `json:"originUrl"`
	DurationMs  int64           `json:"durationMs"`
	Viewport    json.RawMessage `json:"viewport,omitempty"`
	Events      json.RawMessage `json:"events"`
	RrwebEvents json.RawMessage `json:"rrwebEvents,omitempty"`
	HasRrweb    bool            `json:"hasRrweb"`
}

func replayPayloadPath(userId int, sessionId string) string {
	return filepath.Join(model.PluginReplayDataDir(), fmt.Sprintf("%d", userId), sessionId+".json.gz")
}

func ensureReplayDir(userId int) error {
	dir := filepath.Join(model.PluginReplayDataDir(), fmt.Sprintf("%d", userId))
	return os.MkdirAll(dir, 0o755)
}

func SavePluginReplay(userId int, input ReplayUploadInput) (*model.PluginReplaySession, error) {
	sessionId := strings.TrimSpace(input.Id)
	if sessionId == "" {
		return nil, errors.New("id required")
	}
	if len(input.Events) == 0 && len(input.RrwebEvents) == 0 {
		return nil, errors.New("events required")
	}

	payload := ReplayPayload{
		Id:          sessionId,
		Title:       strings.TrimSpace(input.Title),
		OriginUrl:   strings.TrimSpace(input.OriginUrl),
		DurationMs:  input.DurationMs,
		Viewport:    input.Viewport,
		Events:      input.Events,
		RrwebEvents: input.RrwebEvents,
		HasRrweb:    len(input.RrwebEvents) > 2,
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	if len(raw) > maxReplayPayloadBytes {
		return nil, ErrReplayPayloadTooLarge
	}

	if err := ensureReplayDir(userId); err != nil {
		return nil, err
	}
	path := replayPayloadPath(userId, sessionId)
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	if _, err := gz.Write(raw); err != nil {
		return nil, err
	}
	if err := gz.Close(); err != nil {
		return nil, err
	}
	if err := os.WriteFile(path, buf.Bytes(), 0o644); err != nil {
		return nil, err
	}

	eventCount := 0
	var events []any
	if err := json.Unmarshal(input.Events, &events); err == nil {
		eventCount = len(events)
	}
	rrwebCount := 0
	var rrweb []any
	if err := json.Unmarshal(input.RrwebEvents, &rrweb); err == nil {
		rrwebCount = len(rrweb)
	}

	_ = model.DeletePluginReplaySession(userId, sessionId)
	row := &model.PluginReplaySession{
		SessionId:   sessionId,
		UserId:      userId,
		Title:       payload.Title,
		OriginUrl:   payload.OriginUrl,
		DurationMs:  payload.DurationMs,
		EventCount:  eventCount,
		HasRrweb:    rrwebCount > 0,
		RrwebCount:  rrwebCount,
		SizeBytes:   int64(len(buf.Bytes())),
		PayloadPath: path,
		CreatedAt:   time.Now().Unix(),
	}
	if err := model.CreatePluginReplaySession(row); err != nil {
		return nil, err
	}
	return row, nil
}

func LoadPluginReplay(userId int, sessionId string) (*ReplayPayload, error) {
	meta, err := model.GetPluginReplaySession(userId, sessionId)
	if err != nil {
		return nil, err
	}
	f, err := os.Open(meta.PayloadPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	gz, err := gzip.NewReader(f)
	if err != nil {
		return nil, err
	}
	defer gz.Close()
	raw, err := io.ReadAll(gz)
	if err != nil {
		return nil, err
	}
	var payload ReplayPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	return &payload, nil
}

func DeletePluginReplay(userId int, sessionId string) error {
	meta, err := model.GetPluginReplaySession(userId, sessionId)
	if err != nil {
		return err
	}
	_ = os.Remove(meta.PayloadPath)
	return model.DeletePluginReplaySession(userId, sessionId)
}
