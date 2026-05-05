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

// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCQUkrs1QJFmbrAQqt_dRLmgHfU3Zp-c2Y",
  authDomain: "ink-mobile-5ee6a.firebaseapp.com",
  projectId: "ink-mobile-5ee6a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Page() {
  const [ordenes, setOrdenes] = useState([]);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [ordenImprimir, setOrdenImprimir] = useState(null);
  const canvasRef = useRef(null);

  const estados = ["Recibido", "Pendiente", "Recambio", "Finalizado"];

  // 🔄 CARGA
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snap) => {
      setOrdenes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✍️ FIRMA SIMPLE
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let draw = false;

    const start = (e) => {
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

  // 💾 GUARDAR + IMPRIMIR
  const guardar = async () => {
    const firma = canvasRef.current.toDataURL();
    const ahora = new Date();

    const data = {
      ...form,
      firma,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      numero: editId ? form.numero : Date.now(),
      estado: form.estado || "Recibido",
    };

    if (editId) {
      await updateDoc(doc(db, "ordenes", editId), data);
      setEditId(null);
    } else {
      await addDoc(collection(db, "ordenes"), data);
    }

    setOrdenImprimir(data);

    setTimeout(() => window.print(), 200);

    setForm({});
    canvasRef.current.getContext("2d").clearRect(0, 0, 300, 120);
  };

  // 🧠 ACCIONES
  const editar = (o) => {
    setForm(o);
    setEditId(o.id);
  };

  const eliminar = async (id) => {
    if (confirm("Eliminar orden?")) {
      await deleteDoc(doc(db, "ordenes", id));
    }
  };

  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  const enviarWhatsApp = (o) => {
    const msg = `Orden ${o.numero} - ${o.estado}`;
    window.open(`https://wa.me/34${o.telefono}?text=${encodeURIComponent(msg)}`);
  };

  // 💰 PANEL SIMPLE
  const total = ordenes.reduce((a, o) => a + Number(o.presupuesto || 0), 0);

  return (
    <div style={{ padding: 20 }}>
      <h1>Ink-Mobile PRO</h1>

      <h3>💰 Total generado: {total}€</h3>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" value={form.nombre || ""} onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" value={form.telefono || ""} onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" value={form.dispositivo || ""} onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" value={form.problema || ""} onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" value={form.presupuesto || ""} onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>

        <canvas ref={canvasRef} width={300} height={120} style={{border:"1px solid black"}}/>

        <br/><br/>
        <button onClick={guardar}>
          {editId ? "Actualizar + imprimir" : "Guardar + imprimir"}
        </button>
      </div>

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {estados.map(e => (
          <div key={e} style={{ flex:1, background:"#f5f5f5", padding:10 }}>
            <h3>{e}</h3>

            {ordenes.filter(o=>o.estado===e).map(o=>(
              <div key={o.id} style={{ background:"#fff", margin:5, padding:5 }}>
                #{o.numero}<br/>
                {o.nombre}

                <br/>

                <button onClick={()=>editar(o)}>Editar</button>
                <button onClick={()=>eliminar(o.id)}>Eliminar</button>
                <button onClick={()=>enviarWhatsApp(o)}>WhatsApp</button>

                <br/>

                <select value={o.estado} onChange={(ev)=>cambiarEstado(o.id,ev.target.value)}>
                  {estados.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* PRINT */}
      {ordenImprimir && (
        <div className="print">
          <h2>Ink-Mobile</h2>
          <p>Orden #{ordenImprimir.numero}</p>
          <p>{ordenImprimir.nombre}</p>
          <p>{ordenImprimir.dispositivo}</p>
          <p>{ordenImprimir.problema}</p>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility:hidden }
          .print, .print * { visibility:visible }
          .print { position:absolute; top:0 }
        }
      `}</style>
    </div>
  );
}
