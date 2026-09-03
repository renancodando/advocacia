import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const origem = resolve("ArcusAdvocaciaEstrategica", "wwwroot");
const destino = resolve("dist");

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
await cp(origem, destino, { recursive: true });

console.log("Saída estática preparada em dist/.");
