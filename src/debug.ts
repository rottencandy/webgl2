const panel = document.querySelector('#debug details') as HTMLDetailsElement;

export const addToPanel = (ele: Element) => panel.appendChild(ele);
