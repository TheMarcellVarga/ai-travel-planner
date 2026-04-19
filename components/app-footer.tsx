import { NewsletterSignup } from "@/components/newsletter-signup";
import { getCurrentUser } from "@/lib/auth";

export async function AppFooter() {
  const user = await getCurrentUser();

  return (
    <footer className="shell app-footer app-footer--newsletter">
      <div className="footer-copy-stack">
        <div>
          <p className="eyebrow">Built for adventure nomads</p>
          <p className="footer-copy">
            Wild Route turns point-to-point travel planning into a visual route hunt.
          </p>
        </div>
        <div className="footer-grid">
          <span>Prompt-first discovery</span>
          <span>Map-led route playback</span>
          <span>Shareable journey cards</span>
        </div>
      </div>

      <NewsletterSignup defaultEmail={user?.email ?? ""} />
    </footer>
  );
}
