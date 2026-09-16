package engine

import (
	"fmt"
)

// Squad status constants according to Phase 5 Decision Engine specs
const (
	StatusLoan                  = "LOAN"
	StatusKeepFirstTeamRotation = "KEEP (FIRST TEAM ROTATION)"
	StatusSellRelease           = "SELL / RELEASE"
	StatusKeepCoreSquad         = "KEEP (CORE SQUAD)"
	StatusSellConsiderOffer     = "SELL / CONSIDER OFFER"
	StatusSell                  = "SELL"
	StatusSellImmediately       = "SELL IMMEDIATELY"
	StatusKeepExperiencedBackup = "KEEP (EXPERIENCED BACKUP)"
	StatusKeepDevelopment       = "KEEP (DEVELOPMENT SQUAD)"
	StatusKeepSquadRotation     = "KEEP (SQUAD ROTATION)"
)

// EvaluateSquadStatus applies the Squad Status Decision Engine logic based on age, potential, ability,
// progression, appearances, and minutes played.
func EvaluateSquadStatus(age, pa, ca, deltaCA, starts, subs, totalApps, mins int) (recommendation string, reason string) {
	// 1. Kategori Wonderkid / Youth Development (Age <= 21)
	if age <= 21 {
		// Jika Total Apps >= 12 ATAU Mins >= 800:
		// Pemain muda berkembang dengan jam terbang cukup
		if totalApps >= 12 || mins >= 800 {
			return StatusKeepFirstTeamRotation, fmt.Sprintf("Pemain muda berkembang dengan jam terbang cukup (%d menit).", mins)
		}

		// Jika PA >= 140 DAN Total Apps < 10 (atau Mins < 600):
		// Potensi tinggi butuh menit bermain reguler
		if pa >= 140 && (totalApps < 10 || mins < 600) {
			return StatusLoan, fmt.Sprintf("Potensi tinggi (PA %d) butuh menit bermain reguler, minim rotasi di tim utama (%d apps).", pa, totalApps)
		}

		// Jika PA < 130 DAN Mins < 300:
		// Potensi rendah dan tidak bersaing di skuad
		if pa < 130 && mins < 300 {
			return StatusSellRelease, fmt.Sprintf("Potensi rendah (PA %d) dan tidak bersaing di skuad.", pa)
		}

		return StatusKeepDevelopment, fmt.Sprintf("Pemain muda dalam proses pengembangan skuad (%d menit).", mins)
	}

	// 2. Kategori Prime / Matang (Age 22 - 28)
	if age >= 22 && age <= 28 {
		// Jika Mins >= 1000 ATAU Starts >= 10:
		if mins >= 1000 || starts >= 10 {
			return StatusKeepCoreSquad, fmt.Sprintf("Pilar tim reguler (%d starts, %d menit).", starts, mins)
		}

		// Jika Starts < 5 DAN Total Apps < 10 (Mins < 500):
		if starts < 5 && (totalApps < 10 || mins < 500) {
			return StatusSellConsiderOffer, fmt.Sprintf("Pemain usia prima surplus skuad, minim menit bermain (%d menit).", mins)
		}

		// Jika Delta CA stagnan/turun:
		if deltaCA <= 0 {
			return StatusSell, fmt.Sprintf("Performa dan perkembangan CA stagnan/turun (Delta CA: %d).", deltaCA)
		}

		return StatusKeepSquadRotation, fmt.Sprintf("Pemain rotasi skuad utama (%d starts, %d menit).", starts, mins)
	}

	// 3. Kategori Senior / Veteran (Age >= 29)
	// Jika Mins >= 1200 DAN Delta CA >= -1:
	if mins >= 1200 && deltaCA >= -1 {
		return StatusKeepExperiencedBackup, fmt.Sprintf("Veteran berpengaruh, menit bermain masih optimal (%d menit).", mins)
	}

	// Jika Mins < 600 ATAU Delta CA <= -2:
	if mins < 600 || deltaCA <= -2 {
		return StatusSellImmediately, fmt.Sprintf("Usia veteran (%d thn) dengan degradasi CA / minim menit bermain. Jual sebelum value habis.", age)
	}

	return StatusKeepExperiencedBackup, fmt.Sprintf("Veteran berpengaruh dalam rotasi skuad (%d menit).", mins)
}
