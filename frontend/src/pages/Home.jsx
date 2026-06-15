import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-eyebrow">Blockchain-backed academic records</div>
        <h1>Secure, Immutable, and Verifiable Academic Certificates</h1>
        <p>
          Leveraging blockchain technology to ensure certificate authenticity and prevent fraud.
          Issue, verify, and manage academic credentials with complete transparency.
        </p>
      </section>

      <section className="portal-grid">
        <article className="portal-card">
          <div className="portal-icon admin">🏛️</div>
          <h3>University Admin</h3>
          <p>Issue and manage academic certificates on the blockchain.</p>
          <ul>
            <li>Issue digital certificates</li>
            <li>Generate blockchain hash</li>
            <li>View all issued certificates</li>
          </ul>
          <Link to="/university/login" className="btn btn-block">
            Access Admin Portal
          </Link>
        </article>

        <article className="portal-card">
          <div className="portal-icon student">🎓</div>
          <h3>Student</h3>
          <p>View and share your verified academic certificates.</p>
          <ul>
            <li>Access your certificates</li>
            <li>View blockchain hash</li>
            <li>Share with employers</li>
          </ul>
          <Link to="/student/login" className="btn btn-green btn-block">
            Access Student Portal
          </Link>
        </article>

        <article className="portal-card">
          <div className="portal-icon employer">🛡️</div>
          <h3>Employer</h3>
          <p>Verify the authenticity of candidate certificates.</p>
          <ul>
            <li>Verify certificate hash</li>
            <li>Check blockchain records</li>
            <li>Instant verification results</li>
          </ul>
          <Link to="/employer" className="btn btn-violet btn-block">
            Access Employer Portal
          </Link>
        </article>
      </section>
    </main>
  );
}
