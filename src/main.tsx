import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import "./style.css";
const data = JSON.parse(document.getElementById("viewer-data")!.textContent!);
hydrateRoot(document.getElementById("root")!, <App data={data} />);
