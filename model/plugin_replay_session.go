package model

import (
	"github.com/QuantumNous/new-api/common"
)

// PluginReplaySession stores metadata for NaviForge behavior replay uploads.
type PluginReplaySession struct {
	Id           int64  `json:"-" gorm:"primaryKey;autoIncrement"`
	SessionId    string `json:"id" gorm:"type:varchar(64);uniqueIndex"`
	UserId       int    `json:"-" gorm:"index"`
	Title        string `json:"title" gorm:"type:varchar(255)"`
	OriginUrl    string `json:"originUrl" gorm:"type:varchar(2048)"`
	DurationMs   int64  `json:"durationMs"`
	EventCount   int    `json:"eventCount"`
	HasRrweb     bool   `json:"hasRrweb"`
	RrwebCount   int    `json:"rrwebEventCount"`
	SizeBytes    int64  `json:"sizeBytes"`
	PayloadPath  string `json:"-" gorm:"type:varchar(512)"`
	CreatedAt    int64  `json:"createdAt" gorm:"index"`
}

func (PluginReplaySession) TableName() string {
	return "plugin_replay_sessions"
}

func ListPluginReplaySessions(userId int, limit int) ([]PluginReplaySession, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var rows []PluginReplaySession
	err := DB.Where("user_id = ?", userId).Order("created_at desc").Limit(limit).Find(&rows).Error
	return rows, err
}

func GetPluginReplaySession(userId int, sessionId string) (*PluginReplaySession, error) {
	var row PluginReplaySession
	err := DB.Where("user_id = ? AND session_id = ?", userId, sessionId).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func CreatePluginReplaySession(row *PluginReplaySession) error {
	return DB.Create(row).Error
}

func DeletePluginReplaySession(userId int, sessionId string) error {
	return DB.Where("user_id = ? AND session_id = ?", userId, sessionId).Delete(&PluginReplaySession{}).Error
}

func PluginReplayDataDir() string {
	return common.GetEnvOrDefaultString("PLUGIN_REPLAY_DATA_DIR", "data/plugin-replays")
}
