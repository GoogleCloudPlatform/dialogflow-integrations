package ccaas

// EscalationConfig defines the overall configuration for an escalation destination.
type EscalationConfig struct {
	EscalationID      string             `json:"escalation_id"`
	GoogleCCAIPConfig *GoogleCCAIPConfig `json:"google_ccaip_config,omitempty"`
}

// GoogleCCAIPConfig defines the configuration specific to Google CCAIP.
type GoogleCCAIPConfig struct {
	APIBaseURL    string `json:"api_base_url"`
	Auth          Auth   `json:"auth"`
	WebhookSecret string `json:"webhook_secret"`
	DefaultMenuID int    `json:"default_menu_id"`
	DefaultLang   string `json:"default_lang"`
}

// Auth defines authentication credentials for the CCaaS API.
type Auth struct {
	Type           string `json:"type"` // e.g., "basic"
	Username       string `json:"username"`
	PasswordSecret string `json:"password_secret"`
	Password       string `json:"-"`
}
