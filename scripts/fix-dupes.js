const SQL=require('sql.js');
const fs=require('fs');
const path=require('path');
(async()=>{
  const S=await SQL();
  const dbPath=path.join(process.cwd(),'prisma/dev.db');
  const db=new S.Database(fs.readFileSync(dbPath));

  const oldCat=db.exec("SELECT id FROM ShopCategory WHERE slug='cards'");
  const newCat=db.exec("SELECT id FROM ShopCategory WHERE slug='greeting-cards'");
  if(oldCat.length>0 && newCat.length>0){
    const oldId=oldCat[0].values[0][0];
    const newId=newCat[0].values[0][0];
    db.run('UPDATE ShopProduct SET categoryId=? WHERE categoryId=?',[newId,oldId]);
    console.log('Moved products from cards -> greeting-cards');
    db.run('DELETE FROM ShopCategory WHERE id=?',[oldId]);
    console.log('Deleted old cards category');
  }

  const bc=db.exec("SELECT id FROM ShopCategory WHERE slug='bcolma'");
  if(bc.length>0){
    db.run('DELETE FROM ShopCategory WHERE id=?',[bc[0].values[0][0]]);
    console.log('Deleted Bryant Colman category');
  }

  const data=db.export();
  fs.writeFileSync(dbPath,Buffer.from(data));

  const cats=db.exec('SELECT slug,name,(SELECT COUNT(*) FROM ShopProduct WHERE categoryId=ShopCategory.id) as cnt FROM ShopCategory ORDER BY sortOrder');
  console.log('\n=== CATEGORIES NOW ===');
  cats[0].values.forEach(v=>console.log(v[0]+' | '+v[1]+' | '+v[2]+' products'));
  db.close();
})()
