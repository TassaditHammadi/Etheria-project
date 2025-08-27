// simple fetch sans axios pour éviter d'ajouter des intercepteurs
export async function fetchCountry(code: string) {
  const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
  if (!res.ok) throw new Error("Pays introuvable");
  const [data] = await res.json();
  return {
    name: data?.name?.common as string,
    capital: Array.isArray(data?.capital) ? data.capital[0] : data?.capital,
    region: data?.region as string,
    flagPng: data?.flags?.png as string,
    flagAlt: data?.flags?.alt as string,
    cca2: data?.cca2 as string,
  };
}
