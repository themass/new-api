package controller

import (
	"net/http"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

// PluginBootstrap returns default API key + model IDs for browser extension clients (NaviForge).
func PluginBootstrap(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorI18n(c, i18n.MsgUnauthorized)
		return
	}
	payload, err := service.BuildPluginBootstrap(userId)
	if err != nil {
		if err == service.ErrNoPluginApiKey {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "No enabled API key. Enable GENERATE_DEFAULT_TOKEN or create a key in the dashboard.",
			})
			return
		}
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, payload)
}
