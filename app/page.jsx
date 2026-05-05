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
  const [ver, setVer] = useState(null);
  const canvasRef = useRef(null);

  const estados = ["Recibido", "Pendiente", "Recambio", "Finalizado"];

  // 🔄 CARGAR DATOS
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
  const total = ordenes.reduce((a, o) => a + (Number(o.presupuesto) || 0), 0);
  const finalizado = ordenes
    .filter((o) => o.estado === "Finalizado")
    .reduce((a, o) => a + (Number(o.presupuesto) || 0), 0);

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

    // 🖨️ IMPRIMIR
    setTimeout(() => window.print(), 300);

    setForm({});
    setFile(null);
    canvasRef.current.getContext("2d").clearRect(0, 0, 300, 120);
  };

  // 🔄 CAMBIAR ESTADO
  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  // ❌ ELIMINAR
  const eliminar = async (id) => {
    if (confirm("¿Eliminar orden?")) {
      await deleteDoc(doc(db, "ordenes", id));
    }
  };

  // 📱 WHATSAPP
  const enviarWhatsApp = (o) => {
    const msg = `Orden ${o.numero}\nEstado: ${o.estado}\nDispositivo: ${o.dispositivo}`;
    window.open(`https://wa.me/34${o.telefono}?text=${encodeURIComponent(msg)}`);
  };

  // 🎯 AGRUPAR
  const porEstado = (estado) =>
    filtradas.filter((o) => o.estado === estado);

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile PRO</h1>

      {/* PANEL */}
      <div style={{ display: "flex", gap: 20 }}>
        <div>💰 {total}€</div>
        <div>✅ {finalizado}€</div>
        <div>⏳ {pendiente}€</div>
      </div>

      <br />

      {/* BUSCADOR */}
      <input
        placeholder="Buscar cliente..."
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <br /><br />

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

      {/* COLUMNAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        {estados.map((estado) => (
          <div key={estado} style={{ background: "#f5f5f5", padding: 10 }}>
            <h3>{estado}</h3>

            {porEstado(estado).map((o) => (
              <div key={o.id} style={{ border: "1px solid #ccc", margin: 5, padding: 5 }}>
                #{o.numero}

                <br />

                <button onClick={()=>setVer(o)}>Ver</button>
                <button onClick={()=>enviarWhatsApp(o)}>WhatsApp</button>
                <button onClick={()=>eliminar(o.id)}>Eliminar</button>

                <br />

                <select
                  value={o.estado}
                  onChange={(e)=>cambiarEstado(o.id,e.target.value)}
                >
                  {estados.map((e)=><option key={e}>{e}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* MODAL VER */}
      {ver && (
        <div style={{
          position:"fixed",
          top:0,left:0,right:0,bottom:0,
          background:"rgba(0,0,0,0.5)"
        }}>
          <div style={{background:"white",margin:"50px auto",padding:20,width:300}}>
            <h3>Orden #{ver.numero}</h3>

            <p>{ver.nombre}</p>
            <p>{ver.telefono}</p>
            <p>{ver.dispositivo}</p>
            <p>{ver.problema}</p>

            {ver.foto && <img src={ver.foto} width="100%" />}

            <br />

            <button onClick={()=>setVer(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
