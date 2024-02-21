import { md5 } from "hash-wasm";

export default async function calculateMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        const arrayBuffer = new Uint8Array(e.target.result);
        if (arrayBuffer) {
          try {
            const hash = await md5(arrayBuffer);
            resolve(hash);
          } catch (error) {
            reject(error);
          }
        }
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}
