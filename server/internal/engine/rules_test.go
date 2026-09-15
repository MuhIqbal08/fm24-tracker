package engine

import (
	"testing"
)

func TestEvaluatePlayer(t *testing.T) {
	tests := []struct {
		name        string
		age         int
		deltaCA     int
		expectedRec string
	}{
		{
			name:        "Senior player with CA decline -> SELL",
			age:         31,
			deltaCA:     -3,
			expectedRec: RecSell,
		},
		{
			name:        "Senior player boundary age 29 with CA drop -2 -> SELL",
			age:         29,
			deltaCA:     -2,
			expectedRec: RecSell,
		},
		{
			name:        "Senior player age 29 with CA drop -1 (not quite -2) -> MAINTAIN",
			age:         29,
			deltaCA:     -1,
			expectedRec: RecMaintain,
		},
		{
			name:        "Young wonderkid with big spike -> PROMOTE",
			age:         17,
			deltaCA:     8,
			expectedRec: RecPromote,
		},
		{
			name:        "Young wonderkid boundary age 21 with delta +4 -> PROMOTE",
			age:         21,
			deltaCA:     4,
			expectedRec: RecPromote,
		},
		{
			name:        "Young player age 21 with normal delta +2 -> MAINTAIN",
			age:         21,
			deltaCA:     2,
			expectedRec: RecMaintain,
		},
		{
			name:        "Mid-age player stagnated (delta 0) -> MONITOR/LOAN",
			age:         24,
			deltaCA:     0,
			expectedRec: RecMonitorLoan,
		},
		{
			name:        "Mid-age player declining (delta -1) -> MONITOR/LOAN",
			age:         25,
			deltaCA:     -1,
			expectedRec: RecMonitorLoan,
		},
		{
			name:        "Mid-age player progressing (delta +1) -> MAINTAIN",
			age:         24,
			deltaCA:     1,
			expectedRec: RecMaintain,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec, _ := EvaluatePlayer(tt.age, tt.deltaCA)
			if rec != tt.expectedRec {
				t.Errorf("EvaluatePlayer(%d, %d) = %q; want %q", tt.age, tt.deltaCA, rec, tt.expectedRec)
			}
		})
	}
}
