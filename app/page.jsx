"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCQUkrs1QJFmbrAQqt_dRLmgHfU3Zp-c2Y",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Page() {
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);

  // 🔄 CARGA
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snap) => {
      setOrdenes(snap.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, []);

  // ✍️ FIRMA
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let draw = false;

    canvas.onmousedown = () => {
      draw = true;
      ctx.beginPath();
    };

    canvas.onmousemove = (e) => {
      if (!draw) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    window.onmouseup = () => (draw = false);
  }, []);

  // 💾 GUARDAR
  const guardar = async () => {
    try {
      console.log("🚀 Guardando orden...");

      let fotoURL = "";

      // 📸 SUBIR FOTO (si hay)
      if (file) {
        try {
          const storageRef = ref(storage, "ordenes/" + Date.now());
          await uploadBytes(storageRef, file);
          fotoURL = await getDownloadURL(storageRef);
          console.log("✅ Foto subida");
        } catch (e) {
          console.log("⚠️ Error subiendo foto, continuo sin ella", e);
        }
      }

      const firma = canvasRef.current.toDataURL();

      const nueva = {
        ...form,
        foto: fotoURL,
        firma,
        numero: Date.now(),
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        estado: "Recibido",
      };

      await addDoc(collection(db, "ordenes"), nueva);

      console.log("✅ Guardado en Firestore");

      // 🖨️ FORZAR IMPRESIÓN SIEMPRE
      setTimeout(() => {
        window.print();
      }, 300);

      // LIMPIAR
      setForm({});
      setFile(null);
      canvasRef.current
        .getContext("2d")
        .clearRect(0, 0, 300, 120);

    } catch (error) {
      console.error("❌ ERROR GRAVE:", error);
      alert("Error guardando. Mira consola (F12)");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile PRO</h1>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>

        <br /><br />

        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <br /><br />

        <canvas ref={canvasRef} width={300} height={120} style={{border:"2px solid black"}}/>

        <br /><br />

        <button onClick={guardar}>Guardar + imprimir</button>
      </div>

      <br />

      {/* LISTADO SIMPLE */}
      {ordenes.map((o, i) => (
        <div key={i}>
          #{o.numero} - {o.nombre}
        </div>
      ))}
    </div>
  );
}
