# Performance-Release-Gate

**Finale V1-Entscheidung 2026-07-14:** Performance-Score, CLS und TBT erfüllen die Budgets. Der
LCP-Median überschritt bei `/login` (2.893 ms) und der Rangliste (2.782 ms) das 2,5-s-Budget; die
übrigen verbindlichen Oberflächen bestanden. Der Product Owner akzeptiert diese gemessene
Abweichung für den privaten V1-Release. Das Gate wird ausdrücklich **nicht** als vollständig
bestanden bezeichnet; die Rohwerte bleiben in `artifacts/lighthouse-mobile.json` erhalten.

Status: **nicht bestanden**.

Im vollständigen Lauf vom 13. Juli 2026 lagen die Performance-Mediane zwischen 96 und 97, CLS bei 0 und TBT zwischen 47,5 und 85 ms. Die LCP-Mediane lagen zwischen 2.549,7 und 2.717,5 ms und damit über dem verbindlichen Grenzwert von 2.500 ms. Ein isolierter Versuch ohne transluzente Navigationsflächen verbesserte den Login-LCP nicht reproduzierbar und wurde deshalb verworfen.

Es gibt keine p75-Feldwertgrenze, kein RUM und keine Analytics. Ein Preview- oder Produktionsrelease darf diesen offenen Lab-Befund nicht als bestanden behandeln.
