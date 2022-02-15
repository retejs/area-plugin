Rete area plugin
====
Adds functionality to the are of a rete js project

## Installation 

Plugin `install()` arguments:

```typescript
import AreaPlugin from 'rete-area-plugin';
function createEditor(container: HTMLElement) {
    var editor = new Rete.NodeEditor("demo@0.1.0", container);
    editor.use(AreaPlugin, {
        background: true, 
        snap: true,
        scaleExtent: {
            min: 0.5,
            max: 1,
        },
        translateExtent: { 
            width: 5000, 
            height: 4000 
        }
    });
}
```

If `background` is set to `true`, a grid is displayed on the background behind nodes:

<img src="https://i.loli.net/2021/11/02/gVuXSlZnao8J4iw.png" alt="image alt" style="zoom:67%; float:left" />

if `snap` is set to true, dragged elements will snap to grid

<img src="gifs/snap.gif" alt="snap" style="zoom:25%; float:left" />

`scaleExtent` sets the min/max scale of the background

<img src="gifs/zoom.gif" alt="snap" style="zoom:50%; float:left" />

`translateExtent` sets the translation limits for width and height

<img src="gifs/translate.gif" alt="snap" style="zoom:50%; float:left" />

## ZoomAt

the `zoomAt()` function sets the editor to start set the nodes in its viewpoint

```typescript
import AreaPlugin from 'rete-area-plugin';
function createEditor(container: HTMLElement) {
    var editor = new Rete.NodeEditor("demo@0.1.0", container);
    AreaPlugin.zoomAt(editor, editor.nodes);
}
```

