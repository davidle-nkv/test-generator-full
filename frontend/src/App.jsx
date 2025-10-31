import React, {useEffect, useState} from 'react'

import JiraDescriptionAndParameterBuilderExternalData
    from "./components/JiraDescriptionAndParameterBuilderExternalData";


export default function App(){
  // const [items, setItems] = useState([]);
  // const [name, setName] = useState('');
  //
  // // Run once on component mount
  // useEffect(()=>{ fetchItems() }, []);
  //
  // async function fetchItems(){
  //   const res = await fetch('/api/items');
  //   const data = await res.json();
  //   console.log('Fetched items:', data);
  //   setItems(data);
  // }
  //
  // async function addItem(e){
  //   e.preventDefault();
  //   if(!name) return;
  //   await fetch('/api/items', {
  //     method: 'POST',
  //     headers: {'Content-Type':'application/json'},
  //     body: JSON.stringify({name})
  //   });
  //   setName('');
  //   fetchItems();
  // }

  return (
    <div style={{fontFamily:'Arial, sans-serif', padding:20}}>
        <div>
            <JiraDescriptionAndParameterBuilderExternalData />
        </div>
    </div>
  )
}
