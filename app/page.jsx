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
  const [ordenImprimir, setOrdenImprimir] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [editId, setEditId] = useState(null);
  const canvasRef = useRef(null);

  const columnas = ["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      setOrdenes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // FIRMA
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let drawing = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const start = (e) => {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stop = () => (drawing = false);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stop);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    window.addEventListener("touchend", stop);
  }, []);

  // GUARDAR + IMPRIMIR
  const guardar = async () => {
    try {
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
      setFile(null);
      canvasRef.current.getContext("2d").clearRect(0, 0, 300, 120);

    } catch (e) {
      alert("Error");
    }
  };

  const editar = (o) => {
    setForm(o);
    setEditId(o.id);
  };

  const eliminar = async (id) => {
    if (confirm("¿Eliminar?")) {
      await deleteDoc(doc(db, "ordenes", id));
    }
  };

  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  const enviarWhatsApp = (o) => {
    const msg = `📱 Ink-Mobile
Orden #${o.numero}
Cliente: ${o.nombre}
Equipo: ${o.dispositivo}
Estado: ${o.estado}`;

    window.open(`https://wa.me/34${o.telefono}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🔧 Ink-Mobile</h1>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" value={form.nombre || ""} onChange={e=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="DNI" value={form.dni || ""} onChange={e=>setForm({...form,dni:e.target.value})}/>
        <input placeholder="Teléfono" value={form.telefono || ""} onChange={e=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" value={form.dispositivo || ""} onChange={e=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" value={form.problema || ""} onChange={e=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="Presupuesto" value={form.presupuesto || ""} onChange={e=>setForm({...form,presupuesto:e.target.value})}/>

        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <canvas ref={canvasRef} width={300} height={120} style={{ border:"2px solid black", touchAction:"none" }}/>

        <br/><br/>

        <button onClick={guardar}>
          {editId ? "Actualizar + imprimir" : "Guardar + imprimir"}
        </button>
      </div>

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {columnas.map(col => (
          <div key={col} style={{ flex: 1, background: "#f5f5f5", padding: 10 }}>
            <h3>{col}</h3>

            {ordenes.filter(o=>o.estado===col).map(o=>(
              <div key={o.id} style={{ background:"#fff", marginBottom:10, padding:10 }}>
                <b>#{o.numero}</b><br/>
                {o.nombre}<br/>
                {o.dispositivo}

                <br/><br/>

                <button onClick={()=>setOrdenSeleccionada(o)}>Ver</button>
                <button onClick={()=>editar(o)}>Editar</button>
                <button onClick={()=>eliminar(o.id)}>Eliminar</button>
                <button onClick={()=>enviarWhatsApp(o)}>WhatsApp</button>

                <br/><br/>

                <select value={o.estado} onChange={(e)=>cambiarEstado(o.id,e.target.value)}>
                  {columnas.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* DETALLE */}
      {ordenSeleccionada && (
        <div style={{
          position:"fixed",top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.6)"
        }}>
          <div style={{ background:"#fff", padding:20, margin:"5% auto", width:400 }}>
            <h3>Orden #{ordenSeleccionada.numero}</h3>

            <p>{ordenSeleccionada.nombre}</p>
            <p>{ordenSeleccionada.telefono}</p>
            <p>{ordenSeleccionada.dispositivo}</p>
            <p>{ordenSeleccionada.problema}</p>

            {ordenSeleccionada.foto && <img src={ordenSeleccionada.foto} width="100%" />}
            <img src={ordenSeleccionada.firma} width="100%" />

            <button onClick={()=>setOrdenSeleccionada(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* PRINT */}
      {ordenImprimir && (
        <div className="print">
          <h2>Ink-Mobile</h2>
          <p>{ordenImprimir.nombre}</p>
          <p>{ordenImprimir.dispositivo}</p>
          <p>{ordenImprimir.problema}</p>
          <img src={ordenImprimir.firma} width="200"/>
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
