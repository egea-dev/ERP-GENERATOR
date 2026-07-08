# Lógica de códigos ERP de 14 caracteres

La referencia de artículo tiene una estructura fija de 14 caracteres:

```txt
[FF][DDDDDD][MMM][CCC]
 2      6     3    3
```

## Bloques

| Bloque | Posiciones | Longitud | Contenido |
|---|---:|---:|---|
| Familia | 1-2 | 2 | Código de familia |
| Descripción | 3-8 | 6 | Descripción del artículo normalizada |
| Medida | 9-11 | 3 | Medida, ancho o correlativo |
| Color | 12-14 | 3 | Código de color |

## Reglas de normalización

- Todo en mayúsculas.
- Sin tildes.
- Sin espacios.
- Solo letras y números.
- Cada bloque tiene longitud fija.
- Si un bloque es más corto, se rellena con `0` a la derecha, salvo medida numérica, que se rellena con ceros a la izquierda.
- Si un bloque es más largo, se trunca.

## Familias definitivas

| Familia | Título | Descripción base 6 |
|---|---|---|
| AL | ALFOMBRAS | ALFOMB |
| BL | BLANCOS | BLANCO |
| BU | BUTACAS | BUTACA |
| CU | CUADRANTE | CUADRA |
| CH | COLCHAS | COLCHA |
| CN | COLCHONES | COLCHO |
| CS | CONSUMIBLES | CONSUM |
| CO | CORTINA | CORTIN |
| CB | CUBRECANAPES | CUBRCN |
| EB | ESPUMA Y BOATA | ESPBOA |
| ES | ESTOR | ESTOR |
| FU | FUNDA | FUNDA |
| HE | HERRAMIENTAS | HERRAM |
| HJ | HERRAJES | HERRAJ |
| LE | LENCERIA | LENCER |
| MA | MADERA | MADERA |
| MB | MOBILIARIO | MOBILI |
| MO | MANO DE OBRA | MANOOB |
| MT | MANTELERIA | MANTEL |
| MF | MATERIAL OFICINA | MATOFI |
| PV | PAVIMENTO | PAVIME |
| PL | PLAIDS | PLAIDS |
| PA | PAVIMENTO Y ALFOMBRAS | PAVALF |
| RD | RODAPIE | RODAPI |
| RB | RIELES Y BARRAS | RIELBA |
| RL | RELLENOS | RELLEN |
| RV | REVESTIMIENTO | REVEST |
| SI | SILLAS | SILLAS |
| SO | SOFAS | SOFAS |
| SB | SOMBRA | SOMBRA |
| AS | ARTICULOS DE SISTEMA | ARTSIS |
| TE | TELA | TELA |
| AV | ARTICULOS VARIOS | ARTVAR |

## Ejemplos

```txt
Familia: Cortina -> CO
Descripción: Cortina Milán -> CORTIN
Medida: 150 -> 150
Color: Beige -> BEI
Resultado: COCORTIN150BEI
```

```txt
Familia: Tela -> TE
Descripción: Tela -> TELA00
Medida: 80 -> 080
Color: Blanco -> BLA
Resultado: TETELA00080BLA
```

## Implementación en código

Archivo principal:

```txt
apps/frontend/src/config/erp_constants.js
```

Funciones principales:

```txt
normalizeRefText(value)
buildRef(familia, tipo, variante, ancho, alto, coleccion, modelo, color, idTipo, descripcion)
decodeRef(ref)
```

La vista principal que usa esta lógica es:

```txt
apps/frontend/src/components/RefGen/ViewCrear.jsx
```

## Fórmula Excel equivalente

Si:

```txt
A2 = Familia
B2 = Descripción
C2 = Medida
D2 = Color
```

Fórmula base:

```excel
=LEFT(UPPER(A2)&"00",2)&LEFT(UPPER(SUBSTITUTE(B2," ",""))&"000000",6)&TEXT(C2,"000")&LEFT(UPPER(D2)&"000",3)
```
