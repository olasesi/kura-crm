import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";

export const NotFoundPage = () => (
  <main className="status-page">
    <div className="status-page__panel">
      <p className="status-page__eyebrow">Kura CRM</p>
      <h1 className="status-page__code">404</h1>
      <p className="status-page__text">The page you are looking for does not exist.</p>
      <Link to="/" className="btn">
        <span className="btn__icon">
          <Icon name="arrowRight" style={{ transform: "rotate(180deg)" }} />
        </span>
        Back home
      </Link>
    </div>
  </main>
);

export default NotFoundPage;
