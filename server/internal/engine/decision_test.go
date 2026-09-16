package engine

import (
	"strings"
	"testing"
)

func TestEvaluateSquadStatus(t *testing.T) {
	tests := []struct {
		name                 string
		age                  int
		pa                   int
		ca                   int
		deltaCA              int
		starts               int
		subs                 int
		totalApps            int
		mins                 int
		expectedRec          string
		expectedReasonSubstr string
	}{
		// 1. Wonderkid / Youth Development (Age <= 21)
		{
			name:                 "Wonderkid PA >= 140 with low game time -> LOAN",
			age:                  19,
			pa:                   165,
			ca:                   120,
			deltaCA:              2,
			starts:               2,
			subs:                 3,
			totalApps:            5,
			mins:                 320,
			expectedRec:          StatusLoan,
			expectedReasonSubstr: "Potensi tinggi (PA 165) butuh menit bermain reguler",
		},
		{
			name:                 "Youth with regular game time >= 12 apps -> KEEP (FIRST TEAM ROTATION)",
			age:                  20,
			pa:                   155,
			ca:                   135,
			deltaCA:              4,
			starts:               10,
			subs:                 4,
			totalApps:            14,
			mins:                 980,
			expectedRec:          StatusKeepFirstTeamRotation,
			expectedReasonSubstr: "Pemain muda berkembang dengan jam terbang cukup",
		},
		{
			name:                 "Youth with >= 800 mins -> KEEP (FIRST TEAM ROTATION)",
			age:                  21,
			pa:                   148,
			ca:                   130,
			deltaCA:              1,
			starts:               9,
			subs:                 2,
			totalApps:            11,
			mins:                 850,
			expectedRec:          StatusKeepFirstTeamRotation,
			expectedReasonSubstr: "jam terbang cukup (850 menit)",
		},
		{
			name:                 "Youth low PA < 130 and Mins < 300 -> SELL / RELEASE",
			age:                  19,
			pa:                   122,
			ca:                   105,
			deltaCA:              0,
			starts:               0,
			subs:                 2,
			totalApps:            2,
			mins:                 90,
			expectedRec:          StatusSellRelease,
			expectedReasonSubstr: "Potensi rendah (PA 122) dan tidak bersaing di skuad.",
		},

		// 2. Prime / Matang (Age 22 - 28)
		{
			name:                 "Prime player regular starter (starts >= 10, mins >= 1000) -> KEEP (CORE SQUAD)",
			age:                  25,
			pa:                   160,
			ca:                   152,
			deltaCA:              1,
			starts:               16,
			subs:                 2,
			totalApps:            18,
			mins:                 1420,
			expectedRec:          StatusKeepCoreSquad,
			expectedReasonSubstr: "Pilar tim reguler",
		},
		{
			name:                 "Prime player surplus (starts < 5, apps < 10, mins < 500) -> SELL / CONSIDER OFFER",
			age:                  26,
			pa:                   145,
			ca:                   138,
			deltaCA:              0,
			starts:               2,
			subs:                 4,
			totalApps:            6,
			mins:                 280,
			expectedRec:          StatusSellConsiderOffer,
			expectedReasonSubstr: "Pemain usia prima surplus skuad, minim menit bermain",
		},
		{
			name:                 "Prime player declining CA (deltaCA <= 0) -> SELL",
			age:                  27,
			pa:                   150,
			ca:                   140,
			deltaCA:              -1,
			starts:               7,
			subs:                 4,
			totalApps:            11,
			mins:                 680,
			expectedRec:          StatusSell,
			expectedReasonSubstr: "Performa dan perkembangan CA stagnan/turun",
		},

		// 3. Senior / Veteran (Age >= 29)
		{
			name:                 "Senior player low minutes (< 600) -> SELL IMMEDIATELY",
			age:                  31,
			pa:                   165,
			ca:                   148,
			deltaCA:              0,
			starts:               4,
			subs:                 2,
			totalApps:            6,
			mins:                 410,
			expectedRec:          StatusSellImmediately,
			expectedReasonSubstr: "Usia veteran (31 thn) dengan degradasi CA / minim menit bermain.",
		},
		{
			name:                 "Senior player declining CA (deltaCA <= -2) -> SELL IMMEDIATELY",
			age:                  30,
			pa:                   170,
			ca:                   150,
			deltaCA:              -3,
			starts:               10,
			subs:                 2,
			totalApps:            12,
			mins:                 890,
			expectedRec:          StatusSellImmediately,
			expectedReasonSubstr: "Usia veteran (30 thn) dengan degradasi CA / minim menit bermain.",
		},
		{
			name:                 "Senior player active and solid (mins >= 1200, deltaCA >= -1) -> KEEP (EXPERIENCED BACKUP)",
			age:                  32,
			pa:                   168,
			ca:                   155,
			deltaCA:              -1,
			starts:               15,
			subs:                 3,
			totalApps:            18,
			mins:                 1380,
			expectedRec:          StatusKeepExperiencedBackup,
			expectedReasonSubstr: "Veteran berpengaruh, menit bermain masih optimal",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec, reason := EvaluateSquadStatus(tt.age, tt.pa, tt.ca, tt.deltaCA, tt.starts, tt.subs, tt.totalApps, tt.mins)
			if rec != tt.expectedRec {
				t.Errorf("EvaluateSquadStatus() rec = %q, want %q", rec, tt.expectedRec)
			}
			if !strings.Contains(reason, tt.expectedReasonSubstr) {
				t.Errorf("EvaluateSquadStatus() reason = %q, want substring %q", reason, tt.expectedReasonSubstr)
			}
		})
	}
}
