import "../styles/Loader.css";

export default function Loader() {
  return (
    <div className="loader-screen">
      <h1 className="loader-title">EchoHistory</h1>
      <div className="loader-ring">
        <div />
        <div />
        <div />
      </div>
      <p className="loader-text">Loading headlines...</p>
    </div>
  );
}
