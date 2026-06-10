function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-section">
          <h2 className="footer-logo">TeeStore</h2>
          <p>
            Trendy and affordable t-shirts designed for comfort and style.
            Upgrade your wardrobe with TeeStore.
          </p>
        </div>

        {/* ABOUT */}
        <div className="footer-section">
          <h3>About</h3>
          <p>Premium quality t-shirts</p>
          <p>Latest fashion trends</p>
          <p>Affordable pricing</p>
        </div>

        {/* CONTACT */}
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: supportteestore@gmail.com</p>
          <p>Phone: +91 8217006703</p>
          <p>Location: Puttur, Karnataka</p>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2026 TeeStore. All rights reserved.</p>
      </div>

    </footer>
  );
}

export default Footer;