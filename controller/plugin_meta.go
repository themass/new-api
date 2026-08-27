package controller

import (
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/gin-gonic/gin"
)

// PluginMeta exposes build info and documented plugin API endpoints (public).
func PluginMeta(c *gin.Context) {
	buildLabel := constant.PluginBuildLabel
	if buildLabel == "" {
		buildLabel = time.Now().UTC().Format("2006-01-02")
	}
	c.JSON(http.StatusOK, gin.H{
		"version":    common.Version,
		"buildLabel": buildLabel,
		"client":     constant.PluginClientNaviforge,
		"pages": gin.H{
			"connect": "/plugin/connect",
			"docs":    "/plugin/docs",
		},
		"endpoints": []gin.H{
			{
				"method":      "GET",
				"path":        "/api/plugin/meta",
				"auth":        false,
				"description": "Build label, version, and endpoint catalog.",
			},
			{
				"method":      "GET",
				"path":        "/api/plugin/bootstrap",
				"auth":        true,
				"description": "Returns API key, baseURL, and default chat/OCR models for the extension.",
			},
			{
				"method":      "GET",
				"path":        "/api/plugin/replay/sessions",
				"auth":        true,
				"description": "List behavior replay sessions uploaded from NaviForge.",
			},
			{
				"method":      "POST",
				"path":        "/api/plugin/replay/sessions",
				"auth":        true,
				"description": "Upload a behavior replay session (pointer events + optional rrweb DOM).",
			},
			{
				"method":      "GET",
				"path":        "/api/plugin/replay/sessions/:id",
				"auth":        true,
				"description": "Download full replay payload.",
			},
			{
				"method":      "DELETE",
				"path":        "/api/plugin/replay/sessions/:id",
				"auth":        true,
				"description": "Delete a replay session.",
			},
		},
		"defaults": gin.H{
			"chatModel": constant.PluginDefaultChatModel,
			"ocrModel":  constant.PluginDefaultOcrModel,
		},
	})
}