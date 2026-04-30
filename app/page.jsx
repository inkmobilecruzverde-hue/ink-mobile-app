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
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ordenes"), (snapshot) => {
      setOrdenes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

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

  const imprimir = () => {
    const w = window.open("", "_blank");
    w.document.write(`
      <h2>Ink-Mobile</h2>
      <p>CIF: E56261365</p>
      <p>Calle Cruz Verde Nº22</p>
      <p>Tel: 600 639 228</p>
      <hr/>
      <h3>Orden #${ordenSeleccionada.numero}</h3>
      <p>Fecha: ${ordenSeleccionada.fecha} ${ordenSeleccionada.hora}</p>
      <p>Cliente: ${ordenSeleccionada.nombre}</p>
      <p>Teléfono: ${ordenSeleccionada.telefono}</p>
      <p>Dispositivo: ${ordenSeleccionada.dispositivo}</p>
      <p>Problema: ${ordenSeleccionada.problema}</p>
      <p>Presupuesto: ${ordenSeleccionada.presupuesto}€</p>
      <hr/>
      <p>Firma cliente:</p>
      <img src="${ordenSeleccionada.firma}" width="200"/>
      <br/>
      ${ordenSeleccionada.foto ? `<p>Estado del dispositivo:</p><img src="${ordenSeleccionada.foto}" width="200"/>` : ""}
    `);
    w.print();
  };

  const cambiarEstado = async (id, estado) => {
    await updateDoc(doc(db, "ordenes", id), { estado });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏪 Ink-Mobile</h1>

      {/* FORM */}
      <div style={{ background: "#eee", padding: 20, marginBottom: 20 }}>
        <input placeholder="Nombre" onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
        <input placeholder="Teléfono" onChange={(e)=>setForm({...form,telefono:e.target.value})}/>
        <input placeholder="Dispositivo" onChange={(e)=>setForm({...form,dispositivo:e.target.value})}/>
        <input placeholder="Problema" onChange={(e)=>setForm({...form,problema:e.target.value})}/>
        <input placeholder="€" onChange={(e)=>setForm({...form,presupuesto:e.target.value})}/>
        <input type="file" onChange={(e)=>setFile(e.target.files[0])}/>

        <canvas ref={canvasRef} width={300} height={100} style={{border:"1px solid black"}} />

        <br/><br/>
        <button onClick={guardar}>Guardar + imprimir</button>
      </div>

      <h2>Órdenes</h2>

      {ordenes.map(o=>(
        <div key={o.id} style={{border:"1px solid #ccc", margin:10, padding:10}}>
          <b>#{o.numero}</b> - {o.nombre} - {o.dispositivo}

          <br/>

          <button onClick={()=>setOrdenSeleccionada(o)}>Ver</button>

          <select
            value={o.estado}
            onChange={(e)=>cambiarEstado(o.id,e.target.value)}
          >
            <option>Recibido</option>
            <option>Pendiente</option>
            <option>Finalizado</option>
          </select>
        </div>
      ))}

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

            <button onClick={imprimir}>🖨 Imprimir</button>
            <button onClick={()=>setOrdenSeleccionada(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
