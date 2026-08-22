package service

import (
	"errors"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

var ErrNoPluginApiKey = errors.New("no enabled API key for plugin bootstrap")

type PluginBootstrapPayload struct {
	User             map[string]interface{} `json:"user"`
	APIKey           string                 `json:"apiKey"`
	BaseURL          string                 `json:"baseURL"`
	ChatModel        string                 `json:"chatModel"`
	OcrModel         string                 `json:"ocrModel"`
	ChatProfileName  string                 `json:"chatProfileName"`
	OcrProfileName   string                 `json:"ocrProfileName"`
}

func pluginBaseURL() string {
	base := strings.TrimRight(strings.TrimSpace(system_setting.ServerAddress), "/")
	if base == "" {
		base = "http://localhost:3000"
	}
	return base + "/v1"
}

func quotaToUsd(quota int) float64 {
	if common.QuotaPerUnit <= 0 {
		return 0
	}
	return float64(quota) / common.QuotaPerUnit
}

func buildPluginUser(user *model.User) map[string]interface{} {
	email := user.Email
	display := user.DisplayName
	if display == "" {
		display = user.Username
	}
	return map[string]interface{}{
		"id":          fmt.Sprintf("%d", user.Id),
		"email":       email,
		"displayName": display,
		"quotaUsd":    quotaToUsd(user.Quota),
	}
}

// EnsurePluginApiKey returns the first enabled user token, creating a default one if needed.
func EnsurePluginApiKey(userId int, username string) (*model.Token, error) {
	tokens, err := model.GetAllUserTokens(userId, 0, 50)
	if err != nil {
		return nil, err
	}
	for _, item := range tokens {
		if item == nil || item.Status != common.TokenStatusEnabled {
			continue
		}
		full, err := model.GetTokenByIds(item.Id, userId)
		if err != nil {
			return nil, err
		}
		return full, nil
	}

	if !constant.GenerateDefaultToken {
		return nil, ErrNoPluginApiKey
	}

	key, err := common.GenerateKey()
	if err != nil {
		return nil, err
	}
	name := strings.TrimSpace(username)
	if name == "" {
		name = "user"
	}
	token := model.Token{
		UserId:             userId,
		Name:               name + " / NaviForge",
		Key:                key,
		CreatedTime:        common.GetTimestamp(),
		AccessedTime:       common.GetTimestamp(),
		ExpiredTime:        -1,
		RemainQuota:        0,
		UnlimitedQuota:     true,
		ModelLimitsEnabled: false,
		Status:             common.TokenStatusEnabled,
	}
	if setting.DefaultUseAutoGroup {
		token.Group = "auto"
	}
	if err := token.Insert(); err != nil {
		return nil, err
	}
	return &token, nil
}

func BuildPluginBootstrap(userId int) (*PluginBootstrapPayload, error) {
	user, err := model.GetUserById(userId, false)
	if err != nil {
		return nil, err
	}
	token, err := EnsurePluginApiKey(user.Id, user.Username)
	if err != nil {
		return nil, err
	}
	chatModel := strings.TrimSpace(constant.PluginDefaultChatModel)
	ocrModel := strings.TrimSpace(constant.PluginDefaultOcrModel)
	if chatModel == "" {
		chatModel = "gpt-4o"
	}
	if ocrModel == "" {
		ocrModel = "gpt-4o-mini"
	}
	return &PluginBootstrapPayload{
		User:            buildPluginUser(user),
		APIKey:          "sk-" + token.GetFullKey(),
		BaseURL:         pluginBaseURL(),
		ChatModel:      chatModel,
		OcrModel:       ocrModel,
		ChatProfileName: constant.PluginDefaultChatProfileName,
		OcrProfileName:  constant.PluginDefaultOcrProfileName,
	}, nil
}
