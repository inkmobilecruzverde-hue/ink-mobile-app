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

const firebaseConfig = {
  apiKey: "AIzaSyCQUkrs1QJFmbrAQqt_dRLmgHfU3Zp-c2Y",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
  storageBucket: "ink-mobile-5ee6a.appspot.com",
  messagingSenderId: "174258192559",
  appId: "1:174258192559:web:811e204b40c6c8199c945a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Page() {
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const canvasRef = useRef(null);

  const columnas = ["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      setOrdenes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 💰 ESTADÍSTICAS
  const total = ordenes.reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);
  const finalizados = ordenes.filter(o => o.estado === "Finalizado")
    .reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);
  const pendientes = ordenes.filter(o => o.estado !== "Finalizado")
    .reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);

  // 🔍 BUSCADOR
  const filtradas = ordenes.filter(o =>
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

    const nueva = {
      ...form,
      foto: fotoURL,
      firma,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      numero: Date.now(),
      estado: "Recibido",
    };

    await addDoc(collection(db, "ordenes"), nueva);

    setForm({});
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile</h1>

      {/* 💰 PANEL */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div>💰 Total: {total}€</div>
        <div>✅ Finalizado: {finalizados}€</div>
        <div>⏳ Pendiente: {pendientes}€</div>
      </div>

      {/* 🔍 BUSCADOR */}
      <input
        placeholder="Buscar cliente..."
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <br/><br/>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" onChange={e=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" onChange={e=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" onChange={e=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" onChange={e=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" onChange={e=>setForm({...form,presupuesto:e.target.value})}/>

        <canvas ref={canvasRef} width={300} height={100} style={{border:"1px solid black"}} />

        <button onClick={guardar}>Guardar</button>
      </div>

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {columnas.map(col => (
          <div key={col} style={{ flex: 1 }}>
            <h3>{col} ({ordenes.filter(o=>o.estado===col).length})</h3>

            {filtradas.filter(o=>o.estado===col).map(o=>(
              <div key={o.id} style={{ border:"1px solid #ccc", margin:5, padding:5 }}>
                #{o.numero}<br/>
                {o.nombre}<br/>
                💰 {o.presupuesto}€
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
