import "../styles/About-Contact.scss";

export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>About FoodRexpress</h1>
        <p>Fast, fresh & delivered with care!</p>
      </div>

      <img
        className="page-image"
        src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092"
        alt="About FoodRexpress"
      />

      <div className="page-content">
        <p>
          FoodRexpress is your one-stop destination for fast, delicious, and
          freshly prepared food delivered right to your doorstep. Whether it’s a
          spicy biryani, a cheesy pizza, or a refreshing beverage, we make sure
          every meal is made with love.
        </p>
      </div>
    </div>
  );
}
