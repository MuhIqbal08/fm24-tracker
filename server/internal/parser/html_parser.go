package parser

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"fm-tracker/server/internal/models"
)

type Parser struct{}

func NewParser() *Parser {
	return &Parser{}
}

// ParseHTML parses FM24 exported HTML content into a models.ParsedSnapshot.
func (p *Parser) ParseHTML(r io.Reader, fallbackClub, fallbackDate, fallbackSeason string) (*models.ParsedSnapshot, error) {
	// Read full content to calculate SHA-256 checksum and parse HTML
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read HTML content: %w", err)
	}

	hasher := sha256.New()
	hasher.Write(data)
	checksum := hex.EncodeToString(hasher.Sum(nil))

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(data)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML with goquery: %w", err)
	}

	// Extract title/header if available
	extractedClub := ""
	titleText := cleanText(doc.Find("title").Text())
	if titleText == "" {
		titleText = cleanText(doc.Find("h1, h2").First().Text())
	}
	if titleText != "" {
		// Example: "Arsenal - Squad - Players" -> "Arsenal"
		parts := strings.Split(titleText, "-")
		if len(parts) > 0 && cleanText(parts[0]) != "" {
			extractedClub = cleanText(parts[0])
		}
	}

	clubName := fallbackClub
	if clubName == "" {
		clubName = extractedClub
	}
	if clubName == "" {
		clubName = "Unknown Club"
	}

	inGameDate := fallbackDate
	if inGameDate == "" {
		inGameDate = "Unknown Date"
	}

	seasonLabel := fallbackSeason
	if seasonLabel == "" {
		seasonLabel = "Current Season"
	}

	// Locate table with squad data
	var targetTable *goquery.Selection
	var headerMap map[string]int

	doc.Find("table").Each(func(i int, table *goquery.Selection) {
		if targetTable != nil {
			return
		}
		// Look for header row
		table.Find("tr").Each(func(j int, tr *goquery.Selection) {
			if targetTable != nil {
				return
			}
			hMap := p.extractHeaders(tr)
			// A valid squad table must at least have Name or UID and one attribute (Age/CA/Position)
			_, hasName := hMap["name"]
			_, hasUID := hMap["uid"]
			_, hasAge := hMap["age"]
			_, hasPos := hMap["position"]
			_, hasCA := hMap["ca"]

			if (hasName || hasUID) && (hasAge || hasPos || hasCA) {
				targetTable = table
				headerMap = hMap
			}
		})
	})

	if targetTable == nil || headerMap == nil {
		return nil, fmt.Errorf("could not find a valid FM24 squad table in the exported HTML")
	}

	players := make([]models.ParsedPlayer, 0)

	// Iterate rows
	targetTable.Find("tr").Each(func(i int, tr *goquery.Selection) {
		// Check if this row is header row
		if p.isHeaderRow(tr) {
			return
		}

		cells := tr.Find("td, th")
		if cells.Length() == 0 {
			return
		}

		player := p.parsePlayerRow(cells, headerMap)
		if player.Name != "" {
			players = append(players, player)
		}
	})

	return &models.ParsedSnapshot{
		ClubName:     clubName,
		InGameDate:   inGameDate,
		SeasonLabel:  seasonLabel,
		FileChecksum: checksum,
		Players:      players,
	}, nil
}

func (p *Parser) isHeaderRow(tr *goquery.Selection) bool {
	if tr.Find("th").Length() > 0 {
		return true
	}
	text := strings.ToLower(tr.Text())
	return strings.Contains(text, "name") && (strings.Contains(text, "age") || strings.Contains(text, "position"))
}

func (p *Parser) extractHeaders(tr *goquery.Selection) map[string]int {
	headerMap := make(map[string]int)
	tr.Find("th, td").Each(func(idx int, cell *goquery.Selection) {
		text := strings.ToLower(cleanText(cell.Text()))
		switch {
		case text == "uid" || text == "unique id" || text == "id" || strings.Contains(text, "fm_unique_id"):
			headerMap["uid"] = idx
		case text == "name" || text == "player" || text == "person" || strings.Contains(text, "player name"):
			headerMap["name"] = idx
		case text == "nat" || text == "nationality" || text == "nation":
			headerMap["nationality"] = idx
		case text == "position" || text == "pos" || text == "preferred position" || text == "position selected":
			headerMap["position"] = idx
		case text == "age" || text == "dob":
			headerMap["age"] = idx
		case text == "ca" || text == "current ability":
			headerMap["ca"] = idx
		case text == "pa" || text == "potential ability":
			headerMap["pa"] = idx
		case strings.Contains(text, "wage") || strings.Contains(text, "salary"):
			headerMap["wage"] = idx
		case strings.Contains(text, "value") || strings.Contains(text, "transfer value"):
			headerMap["value"] = idx
		case text == "inf" || text == "info" || text == "status":
			headerMap["status"] = idx
		}
	})
	return headerMap
}

func (p *Parser) parsePlayerRow(cells *goquery.Selection, headerMap map[string]int) models.ParsedPlayer {
	getText := func(key string) string {
		if idx, ok := headerMap[key]; ok && idx < cells.Length() {
			return cleanText(cells.Eq(idx).Text())
		}
		return ""
	}

	name := getText("name")
	uid := getText("uid")
	nat := getText("nationality")
	pos := getText("position")
	ageStr := getText("age")
	caStr := getText("ca")
	paStr := getText("pa")
	wageStr := getText("wage")
	valStr := getText("value")
	status := getText("status")

	// If no UID is available, generate a stable fallback UID based on name and nationality
	if uid == "" && name != "" {
		uid = generateFallbackUID(name, nat)
	}

	age := parseNumber(ageStr)
	ca := parseNumber(caStr)
	pa := parseNumber(paStr)
	wage := parseCurrency(wageStr)
	val := parseCurrency(valStr)

	return models.ParsedPlayer{
		FMUniqueID:  uid,
		Name:        name,
		Nationality: nat,
		Position:    pos,
		Age:         age,
		CA:          ca,
		PA:          pa,
		WageWeekly:  wage,
		MarketValue: val,
		Status:      status,
	}
}

func cleanText(s string) string {
	s = strings.ReplaceAll(s, "\u00a0", " ")
	s = strings.ReplaceAll(s, "&nbsp;", " ")
	s = strings.TrimSpace(s)
	spaceRegex := regexp.MustCompile(`\s+`)
	return spaceRegex.ReplaceAllString(s, " ")
}

func parseNumber(s string) int {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" || s == "N/A" {
		return 0
	}
	re := regexp.MustCompile(`\d+`)
	match := re.FindString(s)
	if match == "" {
		return 0
	}
	val, _ := strconv.Atoi(match)
	return val
}

// parseCurrency converts strings like "£150,000 p/w", "€15M", "£35M - £45M", "€500K", "150000" into float64.
func parseCurrency(s string) float64 {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" || strings.EqualFold(s, "n/a") || strings.EqualFold(s, "not for sale") {
		return 0
	}

	// Check if it's a range like "£35M - £45M"
	if strings.Contains(s, "-") {
		parts := strings.Split(s, "-")
		if len(parts) == 2 {
			low := parseSingleCurrency(parts[0])
			high := parseSingleCurrency(parts[1])
			if low > 0 && high > 0 {
				return (low + high) / 2.0
			} else if high > 0 {
				return high
			} else if low > 0 {
				return low
			}
		}
	}

	return parseSingleCurrency(s)
}

func parseSingleCurrency(s string) float64 {
	s = strings.ToUpper(cleanText(s))
	// Remove common currency symbols and wage suffixes
	s = strings.ReplaceAll(s, "£", "")
	s = strings.ReplaceAll(s, "€", "")
	s = strings.ReplaceAll(s, "$", "")
	s = strings.ReplaceAll(s, "¥", "")
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "P/W", "")
	s = strings.ReplaceAll(s, "/W", "")
	s = strings.ReplaceAll(s, "/WK", "")
	s = strings.TrimSpace(s)

	multiplier := 1.0
	if strings.HasSuffix(s, "B") {
		multiplier = 1_000_000_000
		s = strings.TrimSuffix(s, "B")
	} else if strings.HasSuffix(s, "M") {
		multiplier = 1_000_000
		s = strings.TrimSuffix(s, "M")
	} else if strings.HasSuffix(s, "K") {
		multiplier = 1_000
		s = strings.TrimSuffix(s, "K")
	}

	s = strings.TrimSpace(s)
	num, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return num * multiplier
}

func generateFallbackUID(name, nationality string) string {
	slug := strings.ToLower(strings.TrimSpace(name + "_" + nationality))
	h := sha256.Sum256([]byte(slug))
	return fmt.Sprintf("gen_%s", hex.EncodeToString(h[:])[:10])
}
