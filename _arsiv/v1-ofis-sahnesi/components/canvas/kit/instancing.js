/**
 * KKM — Instancing sabitleri
 *
 * Bir instance'ı gizlemek için ölçeği ASLA tam 0 yapmayın:
 * drei <Instances>, her karede instance matrisini decompose/compose eder ve
 * three.js (r186+) determinantı 0 olan matriste ölçeği (1, 1, 1)'e sıfırlar.
 * Sonuç: "gizli" parça 1 m'lik dev bir nesne olarak görünür. Bunun yerine
 * gözle görülmeyecek kadar küçük bir ölçek kullanılır.
 */
export const HIDDEN_SCALE = 1e-4
