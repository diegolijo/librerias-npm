# Librerías Angular npm
Proyecto Angular para generar y publicar librerías npm

## generar la librería:
- ng generate library nombre-librería ->      ./projects/nombre-librería
- npm i ng-packagr ->     instala la herramienta para la transpilación de la librería     

## uso:
- añadir script a package.json del proyecto: 
`"scripts": { "nombre-del-script": "ng-packagr -p projects/nommbre-librería/ng-package.json" }`
- npm run nombre-del-script: ->      genera/reconstruye la librería transpilada (dist/nombre-librería)

## publicar:
- cd  dist/nombre-librería
- npm login
- npm publish

## fuente:
https://medium.com/@insomniocode/creando-una-librer%C3%ADa-angular-y-subi%C3%A9ndola-a-npm-f78d212e8e71

