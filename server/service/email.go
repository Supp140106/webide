package service

import (
	"fmt"
	"net/smtp"
	"os"
)

// SendEmail sends an OTP email using SMTP
func SendEmail(to, otp string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" || port == "" || user == "" || pass == "" || from == "" {
		return fmt.Errorf("SMTP configuration is incomplete in .env")
	}

	subject := fmt.Sprintf("Your Secure OTP Code: %s", otp)

	htmlBody := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
			<div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:8px; text-align:center;">
				<h2 style="color:#333;">🔐 Verify Your Identity</h2>
				<p style="font-size:16px; color:#555;">
					Use the One-Time Password (OTP) below to complete your verification process.
				</p>
				<div style="margin:20px 0;">
					<span style="display:inline-block; font-size:28px; letter-spacing:4px; font-weight:bold; color:#2d89ef;">
						%s
					</span>
				</div>
				<p style="font-size:14px; color:#888;">
					This OTP is valid for a limited time. Do not share it with anyone.
				</p>
				<hr style="margin:30px 0;">
				<p style="font-size:12px; color:#aaa;">
					If you did not request this, please ignore this email.
				</p>
			</div>
		</div>
	`, otp)

	msg := "From: " + from + "\n" +
		"To: " + to + "\n" +
		"Subject: " + subject + "\n" +
		"MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n" +
		htmlBody

	auth := smtp.PlainAuth("", user, pass, host)
	err := smtp.SendMail(host+":"+port, auth, user, []string{to}, []byte(msg))
	if err != nil {
		fmt.Printf("SMTP error: %s\n", err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	fmt.Println("Email sent successfully to:", to)
	return nil
}
