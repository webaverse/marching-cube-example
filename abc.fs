
1: #version 300 es
2: #define varying in
3: layout(location = 0) out highp vec4 pc_fragColor;
4: #define gl_FragColor pc_fragColor
5: #define gl_FragDepthEXT gl_FragDepth
6: #define texture2D texture
7: #define textureCube texture
8: #define texture2DProj textureProj
9: #define texture2DLodEXT textureLod
10: #define texture2DProjLodEXT textureProjLod
11: #define textureCubeLodEXT textureLod
12: #define texture2DGradEXT textureGrad
13: #define texture2DProjGradEXT textureProjGrad
14: #define textureCubeGradEXT textureGrad
15: precision highp float;
16: precision highp int;
17: #define HIGH_PRECISION
18: #define SHADER_NAME MeshPhongMaterial
19: uniform mat4 viewMatrix;
20: uniform vec3 cameraPosition;
21: uniform bool isOrthographic;
22: #define OPAQUE
23: vec4 LinearToLinear( in vec4 value ) {
24: 	return value;
25: }
26: vec4 LinearTosRGB( in vec4 value ) {
27: 	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
28: }
29: vec4 linearToOutputTexel( vec4 value ) { return LinearToLinear( value ); }
30: 
31: #define PHONG
32: uniform vec3 diffuse;
33: uniform vec3 emissive;
34: uniform vec3 specular;
35: uniform float shininess;
36: uniform float opacity;
37: #define PI 3.141592653589793
38: #define PI2 6.283185307179586
39: #define PI_HALF 1.5707963267948966
40: #define RECIPROCAL_PI 0.3183098861837907
41: #define RECIPROCAL_PI2 0.15915494309189535
42: #define EPSILON 1e-6
43: #ifndef saturate
44: #define saturate( a ) clamp( a, 0.0, 1.0 )
45: #endif
46: #define whiteComplement( a ) ( 1.0 - saturate( a ) )
47: float pow2( const in float x ) { return x*x; }
48: float pow3( const in float x ) { return x*x*x; }
49: float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
50: float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
51: float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
52: highp float rand( const in vec2 uv ) {
53: 	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
54: 	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
55: 	return fract( sin( sn ) * c );
56: }
57: #ifdef HIGH_PRECISION
58: 	float precisionSafeLength( vec3 v ) { return length( v ); }
59: #else
60: 	float precisionSafeLength( vec3 v ) {
61: 		float maxComponent = max3( abs( v ) );
62: 		return length( v / maxComponent ) * maxComponent;
63: 	}
64: #endif
65: struct IncidentLight {
66: 	vec3 color;
67: 	vec3 direction;
68: 	bool visible;
69: };
70: struct ReflectedLight {
71: 	vec3 directDiffuse;
72: 	vec3 directSpecular;
73: 	vec3 indirectDiffuse;
74: 	vec3 indirectSpecular;
75: };
76: struct GeometricContext {
77: 	vec3 position;
78: 	vec3 normal;
79: 	vec3 viewDir;
80: #ifdef USE_CLEARCOAT
81: 	vec3 clearcoatNormal;
82: #endif
83: };
84: vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
85: 	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
86: }
87: vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
88: 	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
89: }
90: mat3 transposeMat3( const in mat3 m ) {
91: 	mat3 tmp;
92: 	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
93: 	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
94: 	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
95: 	return tmp;
96: }
97: float linearToRelativeLuminance( const in vec3 color ) {
98: 	vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );
99: 	return dot( weights, color.rgb );
100: }
101: bool isPerspectiveMatrix( mat4 m ) {
102: 	return m[ 2 ][ 3 ] == - 1.0;
103: }
104: vec2 equirectUv( in vec3 dir ) {
105: 	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
106: 	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
107: 	return vec2( u, v );
108: }
109: vec3 packNormalToRGB( const in vec3 normal ) {
110: 	return normalize( normal ) * 0.5 + 0.5;
111: }
112: vec3 unpackRGBToNormal( const in vec3 rgb ) {
113: 	return 2.0 * rgb.xyz - 1.0;
114: }
115: const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
116: const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
117: const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
118: const float ShiftRight8 = 1. / 256.;
119: vec4 packDepthToRGBA( const in float v ) {
120: 	vec4 r = vec4( fract( v * PackFactors ), v );
121: 	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
122: }
123: float unpackRGBAToDepth( const in vec4 v ) {
124: 	return dot( v, UnpackFactors );
125: }
126: vec4 pack2HalfToRGBA( vec2 v ) {
127: 	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
128: 	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
129: }
130: vec2 unpackRGBATo2Half( vec4 v ) {
131: 	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
132: }
133: float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
134: 	return ( viewZ + near ) / ( near - far );
135: }
136: float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
137: 	return linearClipZ * ( near - far ) - near;
138: }
139: float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
140: 	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
141: }
142: float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
143: 	return ( near * far ) / ( ( far - near ) * invClipZ - far );
144: }
145: #ifdef DITHERING
146: 	vec3 dithering( vec3 color ) {
147: 		float grid_position = rand( gl_FragCoord.xy );
148: 		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
149: 		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
150: 		return color + dither_shift_RGB;
151: 	}
152: #endif
153: #if defined( USE_COLOR_ALPHA )
154: 	varying vec4 vColor;
155: #elif defined( USE_COLOR )
156: 	varying vec3 vColor;
157: #endif
158: #if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
159: 	varying vec2 vUv;
160: #endif
161: #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
162: 	varying vec2 vUv2;
163: #endif
164: #ifdef USE_MAP
165: 	uniform sampler2D map;
166: #endif
167: #ifdef USE_ALPHAMAP
168: 	uniform sampler2D alphaMap;
169: #endif
170: #ifdef USE_ALPHATEST
171: 	uniform float alphaTest;
172: #endif
173: #ifdef USE_AOMAP
174: 	uniform sampler2D aoMap;
175: 	uniform float aoMapIntensity;
176: #endif
177: #ifdef USE_LIGHTMAP
178: 	uniform sampler2D lightMap;
179: 	uniform float lightMapIntensity;
180: #endif
181: #ifdef USE_EMISSIVEMAP
182: 	uniform sampler2D emissiveMap;
183: #endif
184: #ifdef USE_ENVMAP
185: 	uniform float envMapIntensity;
186: 	uniform float flipEnvMap;
187: 	#ifdef ENVMAP_TYPE_CUBE
188: 		uniform samplerCube envMap;
189: 	#else
190: 		uniform sampler2D envMap;
191: 	#endif
192: 	
193: #endif
194: #ifdef USE_ENVMAP
195: 	uniform float reflectivity;
196: 	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )
197: 		#define ENV_WORLDPOS
198: 	#endif
199: 	#ifdef ENV_WORLDPOS
200: 		varying vec3 vWorldPosition;
201: 		uniform float refractionRatio;
202: 	#else
203: 		varying vec3 vReflect;
204: 	#endif
205: #endif
206: #ifdef ENVMAP_TYPE_CUBE_UV
207: 	#define cubeUV_maxMipLevel 8.0
208: 	#define cubeUV_minMipLevel 4.0
209: 	#define cubeUV_maxTileSize 256.0
210: 	#define cubeUV_minTileSize 16.0
211: 	float getFace( vec3 direction ) {
212: 		vec3 absDirection = abs( direction );
213: 		float face = - 1.0;
214: 		if ( absDirection.x > absDirection.z ) {
215: 			if ( absDirection.x > absDirection.y )
216: 				face = direction.x > 0.0 ? 0.0 : 3.0;
217: 			else
218: 				face = direction.y > 0.0 ? 1.0 : 4.0;
219: 		} else {
220: 			if ( absDirection.z > absDirection.y )
221: 				face = direction.z > 0.0 ? 2.0 : 5.0;
222: 			else
223: 				face = direction.y > 0.0 ? 1.0 : 4.0;
224: 		}
225: 		return face;
226: 	}
227: 	vec2 getUV( vec3 direction, float face ) {
228: 		vec2 uv;
229: 		if ( face == 0.0 ) {
230: 			uv = vec2( direction.z, direction.y ) / abs( direction.x );
231: 		} else if ( face == 1.0 ) {
232: 			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
233: 		} else if ( face == 2.0 ) {
234: 			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
235: 		} else if ( face == 3.0 ) {
236: 			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
237: 		} else if ( face == 4.0 ) {
238: 			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
239: 		} else {
240: 			uv = vec2( direction.x, direction.y ) / abs( direction.z );
241: 		}
242: 		return 0.5 * ( uv + 1.0 );
243: 	}
244: 	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
245: 		float face = getFace( direction );
246: 		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
247: 		mipInt = max( mipInt, cubeUV_minMipLevel );
248: 		float faceSize = exp2( mipInt );
249: 		float texelSize = 1.0 / ( 3.0 * cubeUV_maxTileSize );
250: 		vec2 uv = getUV( direction, face ) * ( faceSize - 1.0 ) + 0.5;
251: 		if ( face > 2.0 ) {
252: 			uv.y += faceSize;
253: 			face -= 3.0;
254: 		}
255: 		uv.x += face * faceSize;
256: 		if ( mipInt < cubeUV_maxMipLevel ) {
257: 			uv.y += 2.0 * cubeUV_maxTileSize;
258: 		}
259: 		uv.y += filterInt * 2.0 * cubeUV_minTileSize;
260: 		uv.x += 3.0 * max( 0.0, cubeUV_maxTileSize - 2.0 * faceSize );
261: 		uv *= texelSize;
262: 		return texture2D( envMap, uv ).rgb;
263: 	}
264: 	#define r0 1.0
265: 	#define v0 0.339
266: 	#define m0 - 2.0
267: 	#define r1 0.8
268: 	#define v1 0.276
269: 	#define m1 - 1.0
270: 	#define r4 0.4
271: 	#define v4 0.046
272: 	#define m4 2.0
273: 	#define r5 0.305
274: 	#define v5 0.016
275: 	#define m5 3.0
276: 	#define r6 0.21
277: 	#define v6 0.0038
278: 	#define m6 4.0
279: 	float roughnessToMip( float roughness ) {
280: 		float mip = 0.0;
281: 		if ( roughness >= r1 ) {
282: 			mip = ( r0 - roughness ) * ( m1 - m0 ) / ( r0 - r1 ) + m0;
283: 		} else if ( roughness >= r4 ) {
284: 			mip = ( r1 - roughness ) * ( m4 - m1 ) / ( r1 - r4 ) + m1;
285: 		} else if ( roughness >= r5 ) {
286: 			mip = ( r4 - roughness ) * ( m5 - m4 ) / ( r4 - r5 ) + m4;
287: 		} else if ( roughness >= r6 ) {
288: 			mip = ( r5 - roughness ) * ( m6 - m5 ) / ( r5 - r6 ) + m5;
289: 		} else {
290: 			mip = - 2.0 * log2( 1.16 * roughness );		}
291: 		return mip;
292: 	}
293: 	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
294: 		float mip = clamp( roughnessToMip( roughness ), m0, cubeUV_maxMipLevel );
295: 		float mipF = fract( mip );
296: 		float mipInt = floor( mip );
297: 		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
298: 		if ( mipF == 0.0 ) {
299: 			return vec4( color0, 1.0 );
300: 		} else {
301: 			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
302: 			return vec4( mix( color0, color1, mipF ), 1.0 );
303: 		}
304: 	}
305: #endif
306: #ifdef USE_FOG
307: 	uniform vec3 fogColor;
308: 	varying float vFogDepth;
309: 	#ifdef FOG_EXP2
310: 		uniform float fogDensity;
311: 	#else
312: 		uniform float fogNear;
313: 		uniform float fogFar;
314: 	#endif
315: #endif
316: vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
317: 	return RECIPROCAL_PI * diffuseColor;
318: }
319: vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
320: 	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
321: 	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
322: }
323: float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
324: 	float a2 = pow2( alpha );
325: 	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
326: 	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
327: 	return 0.5 / max( gv + gl, EPSILON );
328: }
329: float D_GGX( const in float alpha, const in float dotNH ) {
330: 	float a2 = pow2( alpha );
331: 	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
332: 	return RECIPROCAL_PI * a2 / pow2( denom );
333: }
334: vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float roughness ) {
335: 	float alpha = pow2( roughness );
336: 	vec3 halfDir = normalize( lightDir + viewDir );
337: 	float dotNL = saturate( dot( normal, lightDir ) );
338: 	float dotNV = saturate( dot( normal, viewDir ) );
339: 	float dotNH = saturate( dot( normal, halfDir ) );
340: 	float dotVH = saturate( dot( viewDir, halfDir ) );
341: 	vec3 F = F_Schlick( f0, f90, dotVH );
342: 	float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
343: 	float D = D_GGX( alpha, dotNH );
344: 	return F * ( V * D );
345: }
346: vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
347: 	const float LUT_SIZE = 64.0;
348: 	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
349: 	const float LUT_BIAS = 0.5 / LUT_SIZE;
350: 	float dotNV = saturate( dot( N, V ) );
351: 	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
352: 	uv = uv * LUT_SCALE + LUT_BIAS;
353: 	return uv;
354: }
355: float LTC_ClippedSphereFormFactor( const in vec3 f ) {
356: 	float l = length( f );
357: 	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
358: }
359: vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
360: 	float x = dot( v1, v2 );
361: 	float y = abs( x );
362: 	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
363: 	float b = 3.4175940 + ( 4.1616724 + y ) * y;
364: 	float v = a / b;
365: 	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
366: 	return cross( v1, v2 ) * theta_sintheta;
367: }
368: vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
369: 	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
370: 	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
371: 	vec3 lightNormal = cross( v1, v2 );
372: 	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
373: 	vec3 T1, T2;
374: 	T1 = normalize( V - N * dot( V, N ) );
375: 	T2 = - cross( N, T1 );
376: 	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
377: 	vec3 coords[ 4 ];
378: 	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
379: 	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
380: 	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
381: 	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
382: 	coords[ 0 ] = normalize( coords[ 0 ] );
383: 	coords[ 1 ] = normalize( coords[ 1 ] );
384: 	coords[ 2 ] = normalize( coords[ 2 ] );
385: 	coords[ 3 ] = normalize( coords[ 3 ] );
386: 	vec3 vectorFormFactor = vec3( 0.0 );
387: 	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
388: 	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
389: 	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
390: 	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
391: 	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
392: 	return vec3( result );
393: }
394: float G_BlinnPhong_Implicit( ) {
395: 	return 0.25;
396: }
397: float D_BlinnPhong( const in float shininess, const in float dotNH ) {
398: 	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
399: }
400: vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
401: 	vec3 halfDir = normalize( lightDir + viewDir );
402: 	float dotNH = saturate( dot( normal, halfDir ) );
403: 	float dotVH = saturate( dot( viewDir, halfDir ) );
404: 	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
405: 	float G = G_BlinnPhong_Implicit( );
406: 	float D = D_BlinnPhong( shininess, dotNH );
407: 	return F * ( G * D );
408: }
409: #if defined( USE_SHEEN )
410: float D_Charlie( float roughness, float dotNH ) {
411: 	float alpha = pow2( roughness );
412: 	float invAlpha = 1.0 / alpha;
413: 	float cos2h = dotNH * dotNH;
414: 	float sin2h = max( 1.0 - cos2h, 0.0078125 );
415: 	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
416: }
417: float V_Neubelt( float dotNV, float dotNL ) {
418: 	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
419: }
420: vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
421: 	vec3 halfDir = normalize( lightDir + viewDir );
422: 	float dotNL = saturate( dot( normal, lightDir ) );
423: 	float dotNV = saturate( dot( normal, viewDir ) );
424: 	float dotNH = saturate( dot( normal, halfDir ) );
425: 	float D = D_Charlie( sheenRoughness, dotNH );
426: 	float V = V_Neubelt( dotNV, dotNL );
427: 	return sheenColor * ( D * V );
428: }
429: #endif
430: uniform bool receiveShadow;
431: uniform vec3 ambientLightColor;
432: uniform vec3 lightProbe[ 9 ];
433: vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
434: 	float x = normal.x, y = normal.y, z = normal.z;
435: 	vec3 result = shCoefficients[ 0 ] * 0.886227;
436: 	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
437: 	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
438: 	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
439: 	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
440: 	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
441: 	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
442: 	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
443: 	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
444: 	return result;
445: }
446: vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
447: 	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
448: 	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
449: 	return irradiance;
450: }
451: vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
452: 	vec3 irradiance = ambientLightColor;
453: 	return irradiance;
454: }
455: float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
456: 	#if defined ( PHYSICALLY_CORRECT_LIGHTS )
457: 		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
458: 		if ( cutoffDistance > 0.0 ) {
459: 			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
460: 		}
461: 		return distanceFalloff;
462: 	#else
463: 		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
464: 			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
465: 		}
466: 		return 1.0;
467: 	#endif
468: }
469: float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
470: 	return smoothstep( coneCosine, penumbraCosine, angleCosine );
471: }
472: #if 1 > 0
473: 	struct DirectionalLight {
474: 		vec3 direction;
475: 		vec3 color;
476: 	};
477: 	uniform DirectionalLight directionalLights[ 1 ];
478: 	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
479: 		light.color = directionalLight.color;
480: 		light.direction = directionalLight.direction;
481: 		light.visible = true;
482: 	}
483: #endif
484: #if 0 > 0
485: 	struct PointLight {
486: 		vec3 position;
487: 		vec3 color;
488: 		float distance;
489: 		float decay;
490: 	};
491: 	uniform PointLight pointLights[ 0 ];
492: 	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
493: 		vec3 lVector = pointLight.position - geometry.position;
494: 		light.direction = normalize( lVector );
495: 		float lightDistance = length( lVector );
496: 		light.color = pointLight.color;
497: 		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
498: 		light.visible = ( light.color != vec3( 0.0 ) );
499: 	}
500: #endif
501: #if 0 > 0
502: 	struct SpotLight {
503: 		vec3 position;
504: 		vec3 direction;
505: 		vec3 color;
506: 		float distance;
507: 		float decay;
508: 		float coneCos;
509: 		float penumbraCos;
510: 	};
511: 	uniform SpotLight spotLights[ 0 ];
512: 	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
513: 		vec3 lVector = spotLight.position - geometry.position;
514: 		light.direction = normalize( lVector );
515: 		float angleCos = dot( light.direction, spotLight.direction );
516: 		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
517: 		if ( spotAttenuation > 0.0 ) {
518: 			float lightDistance = length( lVector );
519: 			light.color = spotLight.color * spotAttenuation;
520: 			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
521: 			light.visible = ( light.color != vec3( 0.0 ) );
522: 		} else {
523: 			light.color = vec3( 0.0 );
524: 			light.visible = false;
525: 		}
526: 	}
527: #endif
528: #if 0 > 0
529: 	struct RectAreaLight {
530: 		vec3 color;
531: 		vec3 position;
532: 		vec3 halfWidth;
533: 		vec3 halfHeight;
534: 	};
535: 	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
536: 	uniform RectAreaLight rectAreaLights[ 0 ];
537: #endif
538: #if 1 > 0
539: 	struct HemisphereLight {
540: 		vec3 direction;
541: 		vec3 skyColor;
542: 		vec3 groundColor;
543: 	};
544: 	uniform HemisphereLight hemisphereLights[ 1 ];
545: 	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
546: 		float dotNL = dot( normal, hemiLight.direction );
547: 		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
548: 		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
549: 		return irradiance;
550: 	}
551: #endif
552: #ifndef FLAT_SHADED
553: 	varying vec3 vNormal;
554: 	#ifdef USE_TANGENT
555: 		varying vec3 vTangent;
556: 		varying vec3 vBitangent;
557: 	#endif
558: #endif
559: varying vec3 vViewPosition;
560: struct BlinnPhongMaterial {
561: 	vec3 diffuseColor;
562: 	vec3 specularColor;
563: 	float specularShininess;
564: 	float specularStrength;
565: };
566: void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
567: 	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
568: 	vec3 irradiance = dotNL * directLight.color;
569: 	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
570: 	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
571: }
572: void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
573: 	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
574: }
575: #define RE_Direct				RE_Direct_BlinnPhong
576: #define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
577: #define Material_LightProbeLOD( material )	(0)
578: #ifdef USE_SHADOWMAP
579: 	#if 0 > 0
580: 		uniform sampler2D directionalShadowMap[ 0 ];
581: 		varying vec4 vDirectionalShadowCoord[ 0 ];
582: 		struct DirectionalLightShadow {
583: 			float shadowBias;
584: 			float shadowNormalBias;
585: 			float shadowRadius;
586: 			vec2 shadowMapSize;
587: 		};
588: 		uniform DirectionalLightShadow directionalLightShadows[ 0 ];
589: 	#endif
590: 	#if 0 > 0
591: 		uniform sampler2D spotShadowMap[ 0 ];
592: 		varying vec4 vSpotShadowCoord[ 0 ];
593: 		struct SpotLightShadow {
594: 			float shadowBias;
595: 			float shadowNormalBias;
596: 			float shadowRadius;
597: 			vec2 shadowMapSize;
598: 		};
599: 		uniform SpotLightShadow spotLightShadows[ 0 ];
600: 	#endif
601: 	#if 0 > 0
602: 		uniform sampler2D pointShadowMap[ 0 ];
603: 		varying vec4 vPointShadowCoord[ 0 ];
604: 		struct PointLightShadow {
605: 			float shadowBias;
606: 			float shadowNormalBias;
607: 			float shadowRadius;
608: 			vec2 shadowMapSize;
609: 			float shadowCameraNear;
610: 			float shadowCameraFar;
611: 		};
612: 		uniform PointLightShadow pointLightShadows[ 0 ];
613: 	#endif
614: 	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
615: 		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
616: 	}
617: 	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
618: 		return unpackRGBATo2Half( texture2D( shadow, uv ) );
619: 	}
620: 	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
621: 		float occlusion = 1.0;
622: 		vec2 distribution = texture2DDistribution( shadow, uv );
623: 		float hard_shadow = step( compare , distribution.x );
624: 		if (hard_shadow != 1.0 ) {
625: 			float distance = compare - distribution.x ;
626: 			float variance = max( 0.00000, distribution.y * distribution.y );
627: 			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
628: 		}
629: 		return occlusion;
630: 	}
631: 	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
632: 		float shadow = 1.0;
633: 		shadowCoord.xyz /= shadowCoord.w;
634: 		shadowCoord.z += shadowBias;
635: 		bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
636: 		bool inFrustum = all( inFrustumVec );
637: 		bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
638: 		bool frustumTest = all( frustumTestVec );
639: 		if ( frustumTest ) {
640: 		#if defined( SHADOWMAP_TYPE_PCF )
641: 			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
642: 			float dx0 = - texelSize.x * shadowRadius;
643: 			float dy0 = - texelSize.y * shadowRadius;
644: 			float dx1 = + texelSize.x * shadowRadius;
645: 			float dy1 = + texelSize.y * shadowRadius;
646: 			float dx2 = dx0 / 2.0;
647: 			float dy2 = dy0 / 2.0;
648: 			float dx3 = dx1 / 2.0;
649: 			float dy3 = dy1 / 2.0;
650: 			shadow = (
651: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
652: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
653: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
654: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
655: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
656: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
657: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
658: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
659: 				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
660: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
661: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
662: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
663: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
664: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
665: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
666: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
667: 				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
668: 			) * ( 1.0 / 17.0 );
669: 		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
670: 			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
671: 			float dx = texelSize.x;
672: 			float dy = texelSize.y;
673: 			vec2 uv = shadowCoord.xy;
674: 			vec2 f = fract( uv * shadowMapSize + 0.5 );
675: 			uv -= f * texelSize;
676: 			shadow = (
677: 				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
678: 				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
679: 				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
680: 				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
681: 				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ), 
682: 					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
683: 					 f.x ) +
684: 				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ), 
685: 					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
686: 					 f.x ) +
687: 				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ), 
688: 					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
689: 					 f.y ) +
690: 				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ), 
691: 					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
692: 					 f.y ) +
693: 				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ), 
694: 						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
695: 						  f.x ),
696: 					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ), 
697: 						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
698: 						  f.x ),
699: 					 f.y )
700: 			) * ( 1.0 / 9.0 );
701: 		#elif defined( SHADOWMAP_TYPE_VSM )
702: 			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
703: 		#else
704: 			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
705: 		#endif
706: 		}
707: 		return shadow;
708: 	}
709: 	vec2 cubeToUV( vec3 v, float texelSizeY ) {
710: 		vec3 absV = abs( v );
711: 		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
712: 		absV *= scaleToCube;
713: 		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
714: 		vec2 planar = v.xy;
715: 		float almostATexel = 1.5 * texelSizeY;
716: 		float almostOne = 1.0 - almostATexel;
717: 		if ( absV.z >= almostOne ) {
718: 			if ( v.z > 0.0 )
719: 				planar.x = 4.0 - v.x;
720: 		} else if ( absV.x >= almostOne ) {
721: 			float signX = sign( v.x );
722: 			planar.x = v.z * signX + 2.0 * signX;
723: 		} else if ( absV.y >= almostOne ) {
724: 			float signY = sign( v.y );
725: 			planar.x = v.x + 2.0 * signY + 2.0;
726: 			planar.y = v.z * signY - 2.0;
727: 		}
728: 		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
729: 	}
730: 	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
731: 		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
732: 		vec3 lightToPosition = shadowCoord.xyz;
733: 		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
734: 		vec3 bd3D = normalize( lightToPosition );
735: 		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
736: 			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
737: 			return (
738: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
739: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
740: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
741: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
742: 				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
743: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
744: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
745: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
746: 				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
747: 			) * ( 1.0 / 9.0 );
748: 		#else
749: 			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
750: 		#endif
751: 	}
752: #endif
753: #ifdef USE_BUMPMAP
754: 	uniform sampler2D bumpMap;
755: 	uniform float bumpScale;
756: 	vec2 dHdxy_fwd() {
757: 		vec2 dSTdx = dFdx( vUv );
758: 		vec2 dSTdy = dFdy( vUv );
759: 		float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
760: 		float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
761: 		float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;
762: 		return vec2( dBx, dBy );
763: 	}
764: 	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
765: 		vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
766: 		vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
767: 		vec3 vN = surf_norm;
768: 		vec3 R1 = cross( vSigmaY, vN );
769: 		vec3 R2 = cross( vN, vSigmaX );
770: 		float fDet = dot( vSigmaX, R1 ) * faceDirection;
771: 		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
772: 		return normalize( abs( fDet ) * surf_norm - vGrad );
773: 	}
774: #endif
775: #ifdef USE_NORMALMAP
776: 	uniform sampler2D normalMap;
777: 	uniform vec2 normalScale;
778: #endif
779: #ifdef OBJECTSPACE_NORMALMAP
780: 	uniform mat3 normalMatrix;
781: #endif
782: #if ! defined ( USE_TANGENT ) && ( defined ( TANGENTSPACE_NORMALMAP ) || defined ( USE_CLEARCOAT_NORMALMAP ) )
783: 	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {
784: 		vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
785: 		vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
786: 		vec2 st0 = dFdx( vUv.st );
787: 		vec2 st1 = dFdy( vUv.st );
788: 		vec3 N = surf_norm;
789: 		vec3 q1perp = cross( q1, N );
790: 		vec3 q0perp = cross( N, q0 );
791: 		vec3 T = q1perp * st0.x + q0perp * st1.x;
792: 		vec3 B = q1perp * st0.y + q0perp * st1.y;
793: 		float det = max( dot( T, T ), dot( B, B ) );
794: 		float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );
795: 		return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );
796: 	}
797: #endif
798: #ifdef USE_SPECULARMAP
799: 	uniform sampler2D specularMap;
800: #endif
801: #if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
802: 	uniform float logDepthBufFC;
803: 	varying float vFragDepth;
804: 	varying float vIsPerspective;
805: #endif
806: #if 0 > 0
807: 	varying vec3 vClipPosition;
808: 	uniform vec4 clippingPlanes[ 0 ];
809: #endif
810: void main() {
811: #if 0 > 0
812: 	vec4 plane;
813: 	
814: 	#if 0 < 0
815: 		bool clipped = true;
816: 		
817: 		if ( clipped ) discard;
818: 	#endif
819: #endif
820: 	vec4 diffuseColor = vec4( diffuse, opacity );
821: 	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
822: 	vec3 totalEmissiveRadiance = emissive;
823: #if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
824: 	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
825: #endif
826: #ifdef USE_MAP
827: 	vec4 sampledDiffuseColor = texture2D( map, vUv );
828: 	#ifdef DECODE_VIDEO_TEXTURE
829: 		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
830: 	#endif
831: 	diffuseColor *= sampledDiffuseColor;
832: #endif
833: #if defined( USE_COLOR_ALPHA )
834: 	diffuseColor *= vColor;
835: #elif defined( USE_COLOR )
836: 	diffuseColor.rgb *= vColor;
837: #endif
838: #ifdef USE_ALPHAMAP
839: 	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
840: #endif
841: #ifdef USE_ALPHATEST
842: 	if ( diffuseColor.a < alphaTest ) discard;
843: #endif
844: float specularStrength;
845: #ifdef USE_SPECULARMAP
846: 	vec4 texelSpecular = texture2D( specularMap, vUv );
847: 	specularStrength = texelSpecular.r;
848: #else
849: 	specularStrength = 1.0;
850: #endif
851: float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
852: #ifdef FLAT_SHADED
853: 	vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );
854: 	vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );
855: 	vec3 normal = normalize( cross( fdx, fdy ) );
856: #else
857: 	vec3 normal = normalize( vNormal );
858: 	#ifdef DOUBLE_SIDED
859: 		normal = normal * faceDirection;
860: 	#endif
861: 	#ifdef USE_TANGENT
862: 		vec3 tangent = normalize( vTangent );
863: 		vec3 bitangent = normalize( vBitangent );
864: 		#ifdef DOUBLE_SIDED
865: 			tangent = tangent * faceDirection;
866: 			bitangent = bitangent * faceDirection;
867: 		#endif
868: 		#if defined( TANGENTSPACE_NORMALMAP ) || defined( USE_CLEARCOAT_NORMALMAP )
869: 			mat3 vTBN = mat3( tangent, bitangent, normal );
870: 		#endif
871: 	#endif
872: #endif
873: vec3 geometryNormal = normal;
874: #ifdef OBJECTSPACE_NORMALMAP
875: 	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
876: 	#ifdef FLIP_SIDED
877: 		normal = - normal;
878: 	#endif
879: 	#ifdef DOUBLE_SIDED
880: 		normal = normal * faceDirection;
881: 	#endif
882: 	normal = normalize( normalMatrix * normal );
883: #elif defined( TANGENTSPACE_NORMALMAP )
884: 	vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
885: 	mapN.xy *= normalScale;
886: 	#ifdef USE_TANGENT
887: 		normal = normalize( vTBN * mapN );
888: 	#else
889: 		normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
890: 	#endif
891: #elif defined( USE_BUMPMAP )
892: 	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
893: #endif
894: #ifdef USE_EMISSIVEMAP
895: 	vec4 emissiveColor = texture2D( emissiveMap, vUv );
896: 	totalEmissiveRadiance *= emissiveColor.rgb;
897: #endif
898: BlinnPhongMaterial material;
899: material.diffuseColor = diffuseColor.rgb;
900: material.specularColor = specular;
901: material.specularShininess = shininess;
902: material.specularStrength = specularStrength;
903: 
904: GeometricContext geometry;
905: geometry.position = - vViewPosition;
906: geometry.normal = normal;
907: geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
908: #ifdef USE_CLEARCOAT
909: 	geometry.clearcoatNormal = clearcoatNormal;
910: #endif
911: IncidentLight directLight;
912: #if ( 0 > 0 ) && defined( RE_Direct )
913: 	PointLight pointLight;
914: 	#if defined( USE_SHADOWMAP ) && 0 > 0
915: 	PointLightShadow pointLightShadow;
916: 	#endif
917: 	
918: #endif
919: #if ( 0 > 0 ) && defined( RE_Direct )
920: 	SpotLight spotLight;
921: 	#if defined( USE_SHADOWMAP ) && 0 > 0
922: 	SpotLightShadow spotLightShadow;
923: 	#endif
924: 	
925: #endif
926: #if ( 1 > 0 ) && defined( RE_Direct )
927: 	DirectionalLight directionalLight;
928: 	#if defined( USE_SHADOWMAP ) && 0 > 0
929: 	DirectionalLightShadow directionalLightShadow;
930: 	#endif
931: 	
932: 		directionalLight = directionalLights[ 0 ];
933: 		getDirectionalLightInfo( directionalLight, geometry, directLight );
934: 		#if defined( USE_SHADOWMAP ) && ( 0 < 0 )
935: 		directionalLightShadow = directionalLightShadows[ 0 ];
936: 		directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ 0 ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ 0 ] ) : 1.0;
937: 		#endif
938: 		RE_Direct( directLight, geometry, material, reflectedLight );
939: 	
940: #endif
941: #if ( 0 > 0 ) && defined( RE_Direct_RectArea )
942: 	RectAreaLight rectAreaLight;
943: 	
944: #endif
945: #if defined( RE_IndirectDiffuse )
946: 	vec3 iblIrradiance = vec3( 0.0 );
947: 	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
948: 	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
949: 	#if ( 1 > 0 )
950: 		
951: 			irradiance += getHemisphereLightIrradiance( hemisphereLights[ 0 ], geometry.normal );
952: 		
953: 	#endif
954: #endif
955: #if defined( RE_IndirectSpecular )
956: 	vec3 radiance = vec3( 0.0 );
957: 	vec3 clearcoatRadiance = vec3( 0.0 );
958: #endif
959: #if defined( RE_IndirectDiffuse )
960: 	#ifdef USE_LIGHTMAP
961: 		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
962: 		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
963: 		#ifndef PHYSICALLY_CORRECT_LIGHTS
964: 			lightMapIrradiance *= PI;
965: 		#endif
966: 		irradiance += lightMapIrradiance;
967: 	#endif
968: 	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
969: 		iblIrradiance += getIBLIrradiance( geometry.normal );
970: 	#endif
971: #endif
972: #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
973: 	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
974: 	#ifdef USE_CLEARCOAT
975: 		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
976: 	#endif
977: #endif
978: #if defined( RE_IndirectDiffuse )
979: 	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
980: #endif
981: #if defined( RE_IndirectSpecular )
982: 	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
983: #endif
984: #ifdef USE_AOMAP
985: 	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
986: 	reflectedLight.indirectDiffuse *= ambientOcclusion;
987: 	#if defined( USE_ENVMAP ) && defined( STANDARD )
988: 		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
989: 		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
990: 	#endif
991: #endif
992: 	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
993: #ifdef USE_ENVMAP
994: 	#ifdef ENV_WORLDPOS
995: 		vec3 cameraToFrag;
996: 		if ( isOrthographic ) {
997: 			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
998: 		} else {
999: 			cameraToFrag = normalize( vWorldPosition - cameraPosition );
1000: 		}
1001: 		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
1002: 		#ifdef ENVMAP_MODE_REFLECTION
1003: 			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
1004: 		#else
1005: 			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
1006: 		#endif
1007: 	#else
1008: 		vec3 reflectVec = vReflect;
1009: 	#endif
1010: 	#ifdef ENVMAP_TYPE_CUBE
1011: 		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
1012: 	#elif defined( ENVMAP_TYPE_CUBE_UV )
1013: 		vec4 envColor = textureCubeUV( envMap, reflectVec, 0.0 );
1014: 	#else
1015: 		vec4 envColor = vec4( 0.0 );
1016: 	#endif
1017: 	#ifdef ENVMAP_BLENDING_MULTIPLY
1018: 		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
1019: 	#elif defined( ENVMAP_BLENDING_MIX )
1020: 		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
1021: 	#elif defined( ENVMAP_BLENDING_ADD )
1022: 		outgoingLight += envColor.xyz * specularStrength * reflectivity;
1023: 	#endif
1024: #endif
1025: #ifdef OPAQUE
1026: diffuseColor.a = 1.0;
1027: #endif
1028: #ifdef USE_TRANSMISSION
1029: diffuseColor.a *= transmissionAlpha + 0.1;
1030: #endif
1031: gl_FragColor = vec4( outgoingLight, diffuseColor.a );
1032: #if defined( TONE_MAPPING )
1033: 	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
1034: #endif
1035: gl_FragColor = linearToOutputTexel( gl_FragColor );
1036: #ifdef USE_FOG
1037: 	#ifdef FOG_EXP2
1038: 		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
1039: 	#else
1040: 		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
1041: 	#endif
1042: 	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
1043: #endif
1044: #ifdef PREMULTIPLIED_ALPHA
1045: 	gl_FragColor.rgb *= gl_FragColor.a;
1046: #endif
1047: #ifdef DITHERING
1048: 	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
1049: #endif
1050: }y