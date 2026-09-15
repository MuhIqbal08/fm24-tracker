package engine

import (
	"fmt"

	"fm-tracker/server/internal/db"
	"fm-tracker/server/internal/models"
)

// Recommendation status constants according to PRD & Smart Transfer Advice Engine specs
const (
	RecSell        = "SELL"
	RecMustSell    = "SELL" // Alias
	RecMonitorLoan = "MONITOR/LOAN"
	RecPromote     = "PROMOTE"
	RecMaintain    = "MAINTAIN"
)

// EvaluatePlayer applies the decision rules based on player age and delta CA.
// 1. Status 'SELL': jika Umur >= 29 dan Delta CA <= -2.
// 2. Status 'MONITOR/LOAN': jika Umur 22-26 dan CA stagnan (Delta CA = 0 atau penurunan di usia matang).
// 3. Status 'PROMOTE': jika Umur <= 21 dan Delta CA >= +4.
// 4. Status 'MAINTAIN': kondisi lainnya (rotasi skuad normal).
func EvaluatePlayer(age int, deltaCA int) (recommendation string, reason string) {
	// Rule 1: Age >= 29 and Delta CA <= -2 => SELL
	if age >= 29 && deltaCA <= -2 {
		drop := -deltaCA
		return RecSell, fmt.Sprintf("Age >= 29 and CA dropped by %d points (physical/ability decline)", drop)
	}

	// Rule 3: Age <= 21 and Delta CA >= +4 => PROMOTE
	if age <= 21 && deltaCA >= 4 {
		return RecPromote, fmt.Sprintf("Age <= 21 with rapid CA growth (+%d points, Wonderkid Spike)", deltaCA)
	}

	// Rule 2: 22 <= Age <= 26 and Delta CA <= 0 => MONITOR/LOAN
	if age >= 22 && age <= 26 && deltaCA <= 0 {
		if deltaCA == 0 {
			return RecMonitorLoan, "Age 22-26 with stagnant CA growth (Delta CA = 0, growth plateau)"
		}
		return RecMonitorLoan, fmt.Sprintf("Age 22-26 with declining CA (%d)", deltaCA)
	}

	// Rule 4: Default => MAINTAIN
	return RecMaintain, "Normal progression / core squad rotation candidate"
}

// BuildComparison converts raw comparison rows into structured ComparisonItems with recommendations.
func BuildComparison(rows []db.RawComparisonRow) []models.ComparisonItem {
	items := make([]models.ComparisonItem, 0, len(rows))
	for _, r := range rows {
		rec, reason := EvaluatePlayer(r.Age, r.DeltaCA)
		item := models.ComparisonItem{
			PlayerID:             r.PlayerID,
			FMUniqueID:           r.FMUniqueID,
			Name:                 r.Name,
			Position:             r.Position,
			Age:                  r.Age,
			SquadCategory:        r.SquadCategory,
			BaseCA:               r.BaseCA,
			TargetCA:             r.TargetCA,
			DeltaCA:              r.DeltaCA,
			BasePA:               r.BasePA,
			TargetPA:             r.TargetPA,
			WageWeekly:           r.WageWeekly,
			MarketValue:          r.MarketValue,
			Status:               r.Status,
			Recommendation:       rec,
			RecommendationReason: reason,
		}
		items = append(items, item)
	}
	return items
}
