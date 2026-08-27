package controller

import (
	"encoding/json"
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

// PluginReplayList returns replay session metadata for the authenticated user.
func PluginReplayList(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorI18n(c, i18n.MsgUnauthorized)
		return
	}
	rows, err := model.ListPluginReplaySessions(userId, 50)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	sessions := make([]gin.H, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, gin.H{
			"id":         row.SessionId,
			"title":      row.Title,
			"originUrl":  row.OriginUrl,
			"durationMs": row.DurationMs,
			"eventCount": row.EventCount,
			"hasRrweb":   row.HasRrweb,
			"createdAt":  row.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"sessions": sessions,
		},
	})
}

// PluginReplayUpload stores a behavior replay session (pointer + optional rrweb DOM).
func PluginReplayUpload(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorI18n(c, i18n.MsgUnauthorized)
		return
	}
	var input service.ReplayUploadInput
	if err := c.ShouldBindJSON(&input); err != nil {
		common.ApiError(c, err)
		return
	}
	row, err := service.SavePluginReplay(userId, input)
	if err != nil {
		if err == service.ErrReplayPayloadTooLarge {
			c.JSON(http.StatusOK, gin.H{"success": false, "message": "payload too large (max 25MB)"})
			return
		}
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id": row.SessionId,
		},
	})
}

// PluginReplayGet returns the full replay payload.
func PluginReplayGet(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorI18n(c, i18n.MsgUnauthorized)
		return
	}
	sessionId := c.Param("id")
	payload, err := service.LoadPluginReplay(userId, sessionId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "session not found"})
		return
	}
	record := gin.H{
		"id":          payload.Id,
		"title":       payload.Title,
		"originUrl":   payload.OriginUrl,
		"durationMs":  payload.DurationMs,
		"hasRrweb":    payload.HasRrweb,
		"viewport":    json.RawMessage(payload.Viewport),
		"events":      json.RawMessage(payload.Events),
		"rrwebEvents": json.RawMessage(payload.RrwebEvents),
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"record": record,
		},
	})
}

// PluginReplayDelete removes a replay session.
func PluginReplayDelete(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorI18n(c, i18n.MsgUnauthorized)
		return
	}
	sessionId := c.Param("id")
	if err := service.DeletePluginReplay(userId, sessionId); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "session not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
