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
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      setOrdenes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const guardar = async () => {
    let fotoURL = form.foto || "";

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
    };

    if (editId) {
      await updateDoc(doc(db, "ordenes", editId), data);
      setEditId(null);
    } else {
      await addDoc(collection(db, "ordenes"), {
        ...data,
        numero: Date.now(),
        estado: "Recibido",
      });
    }

    setForm({});
    alert("Guardado");
  };

  const editar = (o) => {
    setForm(o);
    setEditId(o.id);
  };

  const eliminar = async (id) => {
    if (confirm("¿Eliminar esta orden?")) {
      await deleteDoc(doc(db, "ordenes", id));
    }
  };

  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  const enviarWhatsApp = (o) => {
    const mensaje = `
📱 Ink-Mobile

Orden #${o.numero}
Cliente: ${o.nombre}
Dispositivo: ${o.dispositivo}
Estado: ${o.estado}
Problema: ${o.problema}

Gracias por confiar en nosotros 🙌
`;

    const url = `https://wa.me/34${o.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const columnas = ["Recibido", "Pendiente", "Pendiente de recambio", "Finalizado"];

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile</h1>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20 }}>
        <input placeholder="Nombre" value={form.nombre || ""} onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" value={form.telefono || ""} onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" value={form.dispositivo || ""} onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" value={form.problema || ""} onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" value={form.presupuesto || ""} onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>
        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <canvas ref={canvasRef} width={300} height={100} style={{border:"1px solid black"}} />

        <br/><br/>
        <button onClick={guardar}>
          {editId ? "Actualizar orden" : "Guardar orden"}
        </button>
      </div>

      {/* COLUMNAS */}
      <div style={{ display: "flex", gap: 20, marginTop:20 }}>
        {columnas.map(col => (
          <div key={col} style={{ flex: 1, background: "#f5f5f5", padding: 10 }}>
            <h3>{col}</h3>

            {ordenes
              .filter(o => o.estado === col)
              .map(o => (
                <div key={o.id} style={{
                  background:"white",
                  marginBottom:10,
                  padding:10,
                  border:"1px solid #ccc"
                }}>
                  <b>#{o.numero}</b><br/>
                  {o.nombre}<br/>
                  {o.dispositivo}

                  <br/><br/>

                  <button onClick={()=>setOrdenSeleccionada(o)}>Ver</button>
                  <button onClick={()=>editar(o)}>Editar</button>
                  <button onClick={()=>eliminar(o.id)}>Eliminar</button>
                  <button onClick={()=>enviarWhatsApp(o)}>WhatsApp</button>

                  <br/><br/>

                  <select
                    value={o.estado}
                    onChange={(e)=>cambiarEstado(o.id,e.target.value)}
                  >
                    {columnas.map(c=>(
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* DETALLE */}
      {ordenSeleccionada && (
        <div style={{
          position:"fixed",
          top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.6)"
        }}>
          <div style={{
            background:"white",
            padding:20,
            margin:"5% auto",
            width:400
          }}>
            <h3>Orden #{ordenSeleccionada.numero}</h3>

            <p><b>Nombre:</b> {ordenSeleccionada.nombre}</p>
            <p><b>Teléfono:</b> {ordenSeleccionada.telefono}</p>
            <p><b>Dispositivo:</b> {ordenSeleccionada.dispositivo}</p>
            <p><b>Problema:</b> {ordenSeleccionada.problema}</p>
            <p><b>€:</b> {ordenSeleccionada.presupuesto}</p>

            {ordenSeleccionada.foto && (
              <img src={ordenSeleccionada.foto} width="100%" />
            )}

            <img src={ordenSeleccionada.firma} width="100%" />

            <br/><br/>

            <button onClick={()=>setOrdenSeleccionada(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
