import React, {useEffect, useState} from 'react'

import JiraDescriptionBuilder from './components/JiraDescriptionBuilder';
import JiraDescriptionBuilderUI from "./components/JiraDescriptionBuilderUI";

export default function App(){
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{ fetchItems() }, []);

  async function fetchItems(){
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data);
  }

  async function addItem(e){
    e.preventDefault();
    if(!name) return;
    await fetch('/api/items', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name})
    });
    setName('');
    fetchItems();
  }

  return (
    <div style={{fontFamily:'Arial, sans-serif', padding:20}}>
      {/*<h1>Items</h1>*/}
      {/*<form onSubmit={addItem}>*/}
      {/*  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Item name" />*/}
      {/*  <button type="submit">Add</button>*/}
      {/*</form>*/}
      {/*<ul>*/}
      {/*  {items.map(it => <li key={it.id}>{it.name} (#{it.id})</li>)}*/}
      {/*</ul>*/}
    <div>
        <JiraDescriptionBuilder />
    </div>
        {/*<div>*/}
        {/*    <JiraDescriptionBuilderUI />*/}
        {/*</div>*/}
    </div>
  )
}
