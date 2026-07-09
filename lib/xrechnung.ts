import type { Einstellungen, Kunde, Rechnung, RechnungsPosition } from "@prisma/client";
import { addTage, toDatumString } from "@/lib/format";
import { berechneSummen, positionsSumme } from "@/lib/geld";

type RechnungMitDetails = Rechnung & {
  auftrag: { titel: string; kunde: Kunde };
  positionen: RechnungsPosition[];
};

/**
 * Einheiten-Mapping auf UN/ECE Recommendation 20 (Pflicht in der XRechnung).
 */
const EINHEIT_CODES: Record<string, string> = {
  "Std.": "HUR",
  "Stk.": "H87",
  m: "MTR",
  "m²": "MTK",
  l: "LTR",
  kg: "KGM",
  pauschal: "C62",
};

function xml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function betrag(wert: number): string {
  return wert.toFixed(2);
}

/**
 * Prüft, ob alle Angaben vorhanden sind, die die XRechnung zwingend braucht.
 * Liefert eine Liste fehlender Angaben (leer = alles da).
 */
export function pruefeXRechnungsPflichtangaben(
  rechnung: RechnungMitDetails,
  einstellungen: Einstellungen
): string[] {
  const fehlend: string[] = [];
  const kunde = rechnung.auftrag.kunde;

  if (!einstellungen.firmenname) fehlend.push("Firmenname (Einstellungen)");
  if (!einstellungen.strasse || !einstellungen.plz || !einstellungen.ort)
    fehlend.push("Vollständige Firmenadresse (Einstellungen)");
  if (!einstellungen.email)
    fehlend.push("E-Mail-Adresse des Betriebs (Einstellungen – Pflicht als elektronische Adresse)");
  if (!einstellungen.telefon)
    fehlend.push("Telefonnummer des Betriebs (Einstellungen – Pflicht im Verkäuferkontakt)");
  if (!einstellungen.steuernummer && !einstellungen.ustIdNr)
    fehlend.push("Steuernummer oder USt-IdNr. (Einstellungen)");
  if (!einstellungen.iban) fehlend.push("IBAN (Einstellungen)");
  if (!kunde.strasse || !kunde.plz || !kunde.ort)
    fehlend.push("Vollständige Adresse des Kunden");
  if (!kunde.email)
    fehlend.push("E-Mail-Adresse des Kunden (Pflicht als elektronische Empfängeradresse)");
  if (rechnung.positionen.length === 0) fehlend.push("Mindestens eine Rechnungsposition");

  return fehlend;
}

/**
 * Erzeugt eine XRechnung (UBL-Syntax, Profil XRechnung 3.0 / EN 16931).
 *
 * Hinweis: Die App bleibt ein Entwurfs-Werkzeug. Die erzeugte Datei sollte
 * vor dem Versand mit einem Validator (z. B. dem KoSIT-Validator) geprüft
 * bzw. in die Buchhaltungssoftware übernommen werden.
 */
export function erzeugeXRechnung(
  rechnung: RechnungMitDetails,
  einstellungen: Einstellungen
): string {
  const kunde = rechnung.auftrag.kunde;
  const summen = berechneSummen(rechnung.positionen, rechnung.mwstSatz);
  const faellig = addTage(rechnung.datum, rechnung.zahlungszielTage);
  const ibanKompakt = einstellungen.iban.replace(/\s+/g, "");

  // 19 % / 7 % -> Standardsatz (S); 0 % -> steuerbefreit (E) mit Begründung
  const steuerKategorie = rechnung.mwstSatz > 0 ? "S" : "E";
  const steuerBefreiungsGrund =
    rechnung.mwstSatz > 0
      ? ""
      : "Steuerbefreit – Grund bitte prüfen (z. B. Kleinunternehmerregelung nach § 19 UStG)";

  // BT-10 ist in der XRechnung Pflicht: Leitweg-ID/Referenz des Kunden,
  // ersatzweise die Rechnungsnummer
  const kaeuferReferenz = rechnung.kaeuferReferenz?.trim() || rechnung.nummer;

  const positionenXml = rechnung.positionen
    .map((p, i) => {
      const einheitCode = EINHEIT_CODES[p.einheit] ?? "C62";
      return `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${einheitCode}">${p.menge}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${betrag(positionsSumme(p))}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${xml(p.bezeichnung)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${steuerKategorie}</cbc:ID>
        <cbc:Percent>${rechnung.mwstSatz}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${betrag(p.einzelpreis)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("\n");

  const leistungszeitraum =
    rechnung.leistungVon && rechnung.leistungBis
      ? `  <cac:InvoicePeriod>
    <cbc:StartDate>${toDatumString(rechnung.leistungVon)}</cbc:StartDate>
    <cbc:EndDate>${toDatumString(rechnung.leistungBis)}</cbc:EndDate>
  </cac:InvoicePeriod>`
      : "";

  // Steuernummer (FC) und/oder USt-IdNr. (VAT) des Verkäufers
  const verkaeuferSteuern = [
    einstellungen.ustIdNr
      ? `      <cac:PartyTaxScheme>
        <cbc:CompanyID>${xml(einstellungen.ustIdNr.replace(/\s+/g, ""))}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`
      : "",
    einstellungen.steuernummer
      ? `      <cac:PartyTaxScheme>
        <cbc:CompanyID>${xml(einstellungen.steuernummer)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>FC</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const kundenName = kunde.firma || kunde.name;

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${xml(rechnung.nummer)}</cbc:ID>
  <cbc:IssueDate>${toDatumString(rechnung.datum)}</cbc:IssueDate>
  <cbc:DueDate>${toDatumString(faellig)}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:Note>Erstellt mit HandwerkOS als Rechnungsentwurf zur Prüfung. Auftrag: ${xml(rechnung.auftrag.titel)}</cbc:Note>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${xml(kaeuferReferenz)}</cbc:BuyerReference>
${leistungszeitraum}
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="EM">${xml(einstellungen.email)}</cbc:EndpointID>
      <cac:PostalAddress>
        <cbc:StreetName>${xml(einstellungen.strasse)}</cbc:StreetName>
        <cbc:CityName>${xml(einstellungen.ort)}</cbc:CityName>
        <cbc:PostalZone>${xml(einstellungen.plz)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
${verkaeuferSteuern}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xml(einstellungen.firmenname)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${xml(einstellungen.firmenname)}</cbc:Name>
        <cbc:Telephone>${xml(einstellungen.telefon)}</cbc:Telephone>
        <cbc:ElectronicMail>${xml(einstellungen.email)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="EM">${xml(kunde.email ?? "")}</cbc:EndpointID>
      <cac:PostalAddress>
        <cbc:StreetName>${xml(kunde.strasse ?? "")}</cbc:StreetName>
        <cbc:CityName>${xml(kunde.ort ?? "")}</cbc:CityName>
        <cbc:PostalZone>${xml(kunde.plz ?? "")}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xml(kundenName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${xml(ibanKompakt)}</cbc:ID>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:PaymentTerms>
    <cbc:Note>Zahlbar ohne Abzug bis ${toDatumString(faellig)} (${rechnung.zahlungszielTage} Tage).</cbc:Note>
  </cac:PaymentTerms>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${betrag(summen.mwst)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${betrag(summen.netto)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${betrag(summen.mwst)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${steuerKategorie}</cbc:ID>
        <cbc:Percent>${rechnung.mwstSatz}</cbc:Percent>${
          steuerBefreiungsGrund
            ? `
        <cbc:TaxExemptionReason>${xml(steuerBefreiungsGrund)}</cbc:TaxExemptionReason>`
            : ""
        }
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${betrag(summen.netto)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${betrag(summen.netto)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${betrag(summen.brutto)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${betrag(summen.brutto)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${positionenXml}
</ubl:Invoice>
`;
}
