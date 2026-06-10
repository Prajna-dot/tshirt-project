import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <h1>Upgrade Your Style</h1>
      <p>Trendy T-shirts at the best prices</p>

      <button onClick={() => navigate("/products")}>
        Explore Now
      </button>
    </div>
  );
}

export default Home;