package parser

import (
	"strings"
	"testing"
)

func TestParseCurrency(t *testing.T) {
	tests := []struct {
		input    string
		expected float64
	}{
		{"£150,000 p/w", 150000},
		{"€12,500/w", 12500},
		{"$500K", 500000},
		{"€15M", 15000000},
		{"£35M - £45M", 40000000},
		{"Not for sale", 0},
		{"-", 0},
		{"", 0},
	}

	for _, tt := range tests {
		got := parseCurrency(tt.input)
		if got != tt.expected {
			t.Errorf("parseCurrency(%q) = %v; want %v", tt.input, got, tt.expected)
		}
	}
}

func TestParseAppearances(t *testing.T) {
	tests := []struct {
		input       string
		wantStarts  int
		wantSubs    int
		wantTotal   int
	}{
		{"9 (8)", 9, 8, 17},
		{"14", 14, 0, 14},
		{"0 (1)", 0, 1, 1},
		{"-", 0, 0, 0},
		{"", 0, 0, 0},
		{"N/A", 0, 0, 0},
	}

	for _, tt := range tests {
		starts, subs, total := parseAppearances(tt.input)
		if starts != tt.wantStarts || subs != tt.wantSubs || total != tt.wantTotal {
			t.Errorf("parseAppearances(%q) = (%d, %d, %d); want (%d, %d, %d)",
				tt.input, starts, subs, total, tt.wantStarts, tt.wantSubs, tt.wantTotal)
		}
	}
}

func TestParseHTML(t *testing.T) {
	htmlData := `
<!DOCTYPE html>
<html>
<head>
    <title>Arsenal - Squad - Players</title>
</head>
<body>
    <table>
        <thead>
            <tr>
                <th>UID</th>
                <th>Name</th>
                <th>Nat</th>
                <th>Position</th>
                <th>Age</th>
                <th>CA</th>
                <th>PA</th>
                <th>Wage</th>
                <th>Value</th>
                <th>Status</th>
                <th>Apps</th>
                <th>Mins</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>123456</td>
                <td>Thomas Partey</td>
                <td>GHA</td>
                <td>DM, M (C)</td>
                <td>31</td>
                <td>154</td>
                <td>160</td>
                <td>£160,000 p/w</td>
                <td>£15M</td>
                <td>Fit</td>
                <td>16</td>
                <td>1,311</td>
            </tr>
            <tr>
                <td>789012</td>
                <td>Ethan Nwaneri</td>
                <td>ENG</td>
                <td>AM (C), M (C)</td>
                <td>17</td>
                <td>122</td>
                <td>175</td>
                <td>£5,000 p/w</td>
                <td>£30M - £40M</td>
                <td>Fit</td>
                <td>9 (8)</td>
                <td>863</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
`
	p := NewParser()
	snapshot, err := p.ParseHTML(strings.NewReader(htmlData), "", "2024-07-01", "2024/2025 Pre-season")
	if err != nil {
		t.Fatalf("ParseHTML returned error: %v", err)
	}

	if snapshot.ClubName != "Arsenal" {
		t.Errorf("expected club name 'Arsenal', got %s", snapshot.ClubName)
	}
	if len(snapshot.Players) != 2 {
		t.Fatalf("expected 2 players, got %d", len(snapshot.Players))
	}

	p1 := snapshot.Players[0]
	if p1.Name != "Thomas Partey" || p1.FMUniqueID != "123456" || p1.Age != 31 || p1.CA != 154 || p1.PA != 160 || p1.WageWeekly != 160000 || p1.MarketValue != 15000000 {
		t.Errorf("p1 fields mismatch: %+v", p1)
	}
	if p1.Starts != 16 || p1.Subs != 0 || p1.Mins != 1311 {
		t.Errorf("p1 appearance mismatch: starts=%d, subs=%d, mins=%d", p1.Starts, p1.Subs, p1.Mins)
	}

	p2 := snapshot.Players[1]
	if p2.Name != "Ethan Nwaneri" || p2.FMUniqueID != "789012" || p2.Age != 17 || p2.CA != 122 || p2.PA != 175 || p2.WageWeekly != 5000 || p2.MarketValue != 35000000 {
		t.Errorf("p2 fields mismatch: %+v", p2)
	}
	if p2.Starts != 9 || p2.Subs != 8 || p2.Mins != 863 {
		t.Errorf("p2 appearance mismatch: starts=%d, subs=%d, mins=%d", p2.Starts, p2.Subs, p2.Mins)
	}
}
