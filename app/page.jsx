"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// 🔥 FIREBASE
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
  const [busqueda, setBusqueda] = useState("");
  const [ordenImprimir, setOrdenImprimir] = useState(null);
  const canvasRef = useRef(null);

  const estados = ["Recibido", "Pendiente", "Recambio", "Finalizado"];

  // 🔄 DATOS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snap) => {
      setOrdenes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✍️ FIRMA
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let draw = false;

    const start = () => {
      draw = true;
      ctx.beginPath();
    };

    const move = (e) => {
      if (!draw) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const stop = () => (draw = false);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }, []);

  // 💰 PANEL
  const total = ordenes.reduce((a, o) => a + Number(o.presupuesto || 0), 0);

  const finalizado = ordenes
    .filter((o) => o.estado === "Finalizado")
    .reduce((a, o) => a + Number(o.presupuesto || 0), 0);

  const pendiente = total - finalizado;

  // 🔍 FILTRO
  const filtradas = ordenes.filter(
    (o) =>
      o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.telefono?.includes(busqueda)
  );

  // 💾 GUARDAR
  const guardar = async () => {
    let fotoURL = "";

    if (file) {
      const storageRef = ref(storage, "ordenes/" + Date.now());
      await uploadBytes(storageRef, file);
      fotoURL = await getDownloadURL(storageRef);
    }

    const firma = canvasRef.current.toDataURL();
    const ahora = new Date();

    const data = {
      ...form,
      foto: fotoURL,
      firma,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      numero: Date.now(),
      estado: "Recibido",
    };

    await addDoc(collection(db, "ordenes"), data);

    setOrdenImprimir(data);
    setTimeout(() => window.print(), 200);

    setForm({});
    setFile(null);
    canvasRef.current.getContext("2d").clearRect(0, 0, 300, 120);
  };

  // 📱 WHATSAPP
  const enviarWhatsApp = (o) => {
    const msg = `Orden ${o.numero} - ${o.estado}`;
    window.open(`https://wa.me/34${o.telefono}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile PRO</h1>

      {/* PANEL */}
      <div style={{ display: "flex", gap: 20 }}>
        <div>💰 Total: {total}€</div>
        <div>✅ Finalizado: {finalizado}€</div>
        <div>⏳ Pendiente: {pendiente}€</div>
      </div>

      <br/>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar cliente..."
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <br/><br/>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>

        {/* 📸 FOTO */}
        <br/><br/>
        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        {/* ✍️ FIRMA */}
        <br/><br/>
        <canvas ref={canvasRef} width={300} height={120} style={{border:"2px solid black"}}/>

        <br/><br/>

        <button onClick={guardar}>Guardar + imprimir</button>
      </div>

      {/* LISTADO */}
      {filtradas.map(o=>(
        <div key={o.id} style={{border:"1px solid #ccc", margin:10, padding:10}}>
          #{o.numero} - {o.nombre}

          <br/>

          {o.foto && (
            <img src={o.foto} width="120" />
          )}

          <br/>

          <button onClick={()=>enviarWhatsApp(o)}>WhatsApp</button>
        </div>
      ))}

      {/* PRINT */}
      {ordenImprimir && (
        <div className="print">
          <h2>Ink-Mobile</h2>
          <p>Orden #{ordenImprimir.numero}</p>
          <p>{ordenImprimir.nombre}</p>

          {ordenImprimir.foto && (
            <img src={ordenImprimir.foto} width="200"/>
          )}
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility:hidden }
          .print, .print * { visibility:visible }
        }
      `}</style>
    </div>
  );
}
