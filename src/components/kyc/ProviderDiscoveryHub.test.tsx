import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ i18n: { language: "nl" }, t: (k: string) => k }) }));
import { ProviderDiscoveryHub } from "./ProviderDiscoveryHub";

afterEach(cleanup);
const all = () => within(screen.getByRole("region", { name: "Alle providers" }));

describe("Provider Discovery Hub", () => {
  it("starts only providers with an active engine", () => {
    const start = vi.fn();
    render(<ProviderDiscoveryHub active={new Set(["didit"])} busy={null} onStart={start} />);
    const didit = all().getByRole("article", { name: "Didit" });
    fireEvent.click(within(didit).getByRole("button", { name: /Start verificatie/ }));
    expect(start).toHaveBeenCalledWith("didit");
    expect(within(all().getByRole("article", { name: "itsme®" })).getByRole("button", { name: "Binnenkort" })).toBeDisabled();
    expect(within(all().getByRole("article", { name: "W Identity" })).getByRole("button", { name: "Nog niet actief" })).toBeDisabled();
  });

  it("filters with the search bar and the chips", () => {
    render(<ProviderDiscoveryHub active={new Set()} busy={null} onStart={() => {}} />);
    expect(screen.getByPlaceholderText("Zoek provider, land of documenttype (bijv. itsme, DigiD, IDnow)...")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Zoek een provider" }), { target: { value: "DigiD" } });
    expect(all().getAllByRole("article").map((a) => a.getAttribute("aria-label"))).toEqual(["DigiD"]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "🛡️ Zero-Knowledge" }));
    expect(screen.getByRole("button", { name: "🛡️ Zero-Knowledge" })).toHaveAttribute("aria-pressed", "true");
    expect(all().getAllByRole("article").map((a) => a.getAttribute("aria-label")).sort()).toEqual(["W Identity", "World ID"]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "qqqq" } });
    expect(screen.getByText("Geen provider gevonden. Probeer een andere zoekterm.")).toBeInTheDocument();
  });

  it("shows the privacy ratings on the cards", () => {
    render(<ProviderDiscoveryHub active={new Set()} busy={null} onStart={() => {}} />);
    expect(within(all().getByRole("article", { name: "itsme®" })).getByText("EU eIDAS Hoog")).toBeInTheDocument();
    expect(within(all().getByRole("article", { name: "World ID" })).getByText("Zero-Knowledge Enclave")).toBeInTheDocument();
    expect(within(all().getByRole("article", { name: "Didit" })).getByText("Biometrisch")).toBeInTheDocument();
  });
});
