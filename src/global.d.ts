declare module 'gl-matrix/vec4' {
	import { vec4 } from 'gl-matrix';
	export = vec4;
}

declare module 'gl-matrix/vec3' {
	import { vec3 } from 'gl-matrix';
	export = vec3;
}

declare module 'gl-matrix/vec2' {
	import { vec2 } from 'gl-matrix';
	export = vec2;
}

declare module 'gl-matrix/mat4' {
	import { mat4 } from 'gl-matrix';
	export = mat4;
}

declare module 'gl-matrix/mat3' {
	import { mat3 } from 'gl-matrix';
	export = mat3;
}

declare module '*.png' {
    const data: string;
	export default data;
}

declare module '*.glsl' {
    const data: string;
	export default data;
}

declare module '*.vert' {
    const data: string;
	export default data;
}

declare module '*.frag' {
    const data: string;
	export default data;
}
