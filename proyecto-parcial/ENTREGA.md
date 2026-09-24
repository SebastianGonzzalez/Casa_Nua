# Entrega del parcial — Casa Nua

## Resumen

Esta versión reorganiza el proyecto recibido y refuerza las validaciones para que el código sea más sostenible y la demostración cubra los casos de entrada inválida más importantes.

## Cambios principales

1. Los estilos se movieron a `css/styles.css`.
2. El JavaScript se dividió en módulos dentro de `js/`.
3. `app.js` quedó como punto de entrada.
4. Se centralizaron constantes y límites en `config.js`.
5. Se centralizó la persistencia en `storage.js`.
6. Se centralizaron las validaciones en `validators.js`.
7. Se separaron los módulos por pantalla/responsabilidad.
8. Se agregaron límites máximos para números y textos.
9. Se rechazaron números negativos en precio, stock y cantidades.
10. Se rechazaron decimales donde se requieren enteros.
11. Se controlan valores no finitos como `NaN` e `Infinity`.
12. Se valida duplicidad de correos y nombres de productos.
13. Se valida el rol contra una lista permitida.
14. Se valida el estado de la cuenta.
15. Se protege el acceso por sesión y rol.
16. Se protege el acceso de un cliente a compras ajenas.
17. El carrito se vuelve a validar antes de confirmar.
18. El stock se vuelve a comprobar al confirmar la compra.
19. El total se recalcula antes de guardar.
20. El detalle guarda el valor unitario histórico.
21. El historial no depende del producto actual para conocer el precio histórico.
22. Se agregó migración de datos desde `parcialCompraDB_v1`.
23. Se amplió el README con estructura, ejecución, modelo, validaciones, pruebas y limitaciones.

## Ejecución

Abrir el proyecto mediante Live Server o Live Preview:

```text
index.html
```

No se recomienda abrirlo directamente con `file://` porque el proyecto utiliza ES Modules.

## Credenciales

### Admin

```text
admin@tienda.local
Admin123!
```

### Cliente

```text
cliente@tienda.local
Cliente123!
```

## Nota de base de datos

El material original no contiene backend ni conexión a una base de datos. Por eso se mantiene `localStorage` para la demostración.

Para una entrega con backend real se deben mover al servidor todas las reglas de seguridad y negocio: autenticación, autorización, validación, cálculo de totales y actualización transaccional del inventario.

Consulte `README.md` para el detalle completo de las validaciones y casos de prueba.
