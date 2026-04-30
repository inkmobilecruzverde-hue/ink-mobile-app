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

  // 🔄 CARGAR
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrdenes(data);
    });
    return () => unsub();
  }, []);

  // 🧮 ESTADÍSTICAS
  const totalFacturado = ordenes
    .filter((o) => o.estado === "Finalizado")
    .reduce((acc, o) => acc + Number(o.presupuesto || 0), 0);

  const pendientes = ordenes.filter(o => o.estado !== "Finalizado").length;

  // 🔍 FILTRO
  const filtradas = ordenes.filter(
    (o) =>
      o.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.telefono?.includes(busqueda)
  );

  // ✍️ FIRMA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let drawing = false;

    const start = () => (drawing = true);
    const end = () => (drawing = false);

    const draw = (e) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = 2;
      ctx.lineTo(
        (e.clientX || e.touches?.[0].clientX) - rect.left,
        (e.clientY || e.touches?.[0].clientY) - rect.top
      );
      ctx.stroke();
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mousemove", draw);
  }, []);

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

    await addDoc(collection(db, "ordenes"), {
      ...form,
      foto: fotoURL,
      firma,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      numero: Date.now(),
      estado: "Recibido",
    });

    alert("Orden guardada");
  };

  // 🔄 CAMBIAR ESTADO
  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile</h1>

      {/* 📊 PANEL */}
      <div style={{ display: "flex", gap: 20 }}>
        <div>💰 Facturado: {totalFacturado}€</div>
        <div>📦 Pendientes: {pendientes}</div>
        <div>📄 Total órdenes: {ordenes.length}</div>
      </div>

      <br />

      {/* 🔍 BUSCADOR */}
      <input
        placeholder="Buscar cliente..."
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <br /><br />

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input name="nombre" placeholder="Nombre" onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input name="telefono" placeholder="Teléfono" onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input name="dispositivo" placeholder="Dispositivo" onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input name="problema" placeholder="Problema" onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input name="presupuesto" placeholder="€" onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>

        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <canvas ref={canvasRef} width={300} height={100} style={{border:"1px solid black"}} />

        <button onClick={guardar}>Guardar</button>
      </div>

      <h2>Órdenes</h2>

      {filtradas.map(o=>(
        <div key={o.id} style={{border:"1px solid #ccc",margin:10,padding:10}}>
          <b>#{o.numero}</b> - {o.nombre} - {o.dispositivo}
          <br/>
          💰 {o.presupuesto}€
          <br/>

          <select value={o.estado} onChange={(e)=>cambiarEstado(o.id,e.target.value)}>
            <option>Recibido</option>
            <option>Pendiente</option>
            <option>Finalizado</option>
          </select>
        </div>
      ))}
    </div>
  );
}
