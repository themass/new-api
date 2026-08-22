package service

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
)

func TestQuotaToUsdUsesQuotaPerUnit(t *testing.T) {
	prev := common.QuotaPerUnit
	common.QuotaPerUnit = 500_000
	t.Cleanup(func() { common.QuotaPerUnit = prev })
	assert.Equal(t, 10.0, quotaToUsd(5_000_000))
}
