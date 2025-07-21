import { useEffect, useRef, useMemo } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { throttle, prefersReducedMotion } from "../../utils/performance";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  theme?: 'light' | 'dark';
}

export default function Aurora(props: AuroraProps) {
  const {
    colorStops,
    amplitude = 1.0,
    blend = 0.5,
    theme = 'dark',
  } = props;

  // Theme-adaptive color sets
  const getThemeColors = () => {
    if (colorStops) return colorStops; // Use custom colors if provided
    
    if (theme === 'light') {
      // Purple-focused lighter versions for light theme
      return ["#C084FC", "#DDD6FE", "#A78BFA"]; // Light purple, very light purple, medium purple
    } else {
      // Current colors for dark theme
      return ["#9333EA", "#F472B6", "#A855F7"]; // Purple, pink, purple
    }
  };

  const themeColors = getThemeColors();
  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);
  
  // Memoize color calculations to prevent recalculation on every frame
  const colorStopsArray = useMemo(() => {
    return themeColors.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });
  }, [themeColors]);

  // Skip animation if user prefers reduced motion
  const shouldAnimate = useMemo(() => !prefersReducedMotion(), []);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn || typeof window === 'undefined') return;

    let renderer: Renderer | null = null;
    let program: Program | null = null;
    let mesh: Mesh | null = null;
    let animateId = 0;
    let isDestroyed = false;
    
    // Throttle resize to prevent performance issues
    const resize = throttle(() => {
      if (!ctn || !program || isDestroyed || typeof window === 'undefined') return;
      try {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer?.setSize(width, height);
        if (program?.uniforms?.uResolution) {
          program.uniforms.uResolution.value = [width, height];
        }
      } catch (error) {
        console.warn('Aurora resize error:', error);
      }
    }, 250); // Throttle to max 4 resizes per second

    try {
      renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
      
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    if (typeof window !== 'undefined') {
    window.addEventListener("resize", resize);
    }

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete (geometry.attributes).uv;
    }

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: typeof window !== 'undefined' ? [window.innerWidth, window.innerHeight] : [1920, 1080] },
        uBlend: { value: blend },
      },
    });

      mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    let lastFrameTime = 0;
    const targetFrameTime = shouldAnimate ? 1000 / 30 : 1000 / 10; // 30fps when animating, 10fps when not
    
    const update = (t: number) => {
        if (isDestroyed || !program || !renderer) return;
        
        // Skip frame if we haven't reached target frame time (performance optimization)
        if (t - lastFrameTime < targetFrameTime) {
          animateId = requestAnimationFrame(update);
          return;
        }
        
        lastFrameTime = t;
        
        // Skip rendering when page is hidden (performance optimization)
        if (document.hidden) {
          animateId = requestAnimationFrame(update);
          return;
        }
        
        try {
      animateId = requestAnimationFrame(update);
      const { time = t * 0.01, speed = shouldAnimate ? 1.0 : 0.1 } = propsRef.current;
          
        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
          
        // Use memoized color stops to avoid recalculation
        program.uniforms.uColorStops.value = colorStopsArray;
          
                     if (mesh) {
        renderer.render({ scene: mesh });
           }
        } catch (error) {
          console.warn('Aurora render error:', error);
          isDestroyed = true;
      }
    };
      
    animateId = requestAnimationFrame(update);
    resize();

    } catch (error) {
      console.error('Aurora initialization error:', error);
      isDestroyed = true;
    }

    return () => {
      isDestroyed = true;
      
      // Cancel animation frame
      if (animateId) {
      cancelAnimationFrame(animateId);
      }
      
      // Remove event listeners
      if (typeof window !== 'undefined') {
      window.removeEventListener("resize", resize);
      }
      
      // Clean up DOM
      if (ctn && renderer?.gl?.canvas?.parentNode === ctn) {
        try {
          ctn.removeChild(renderer.gl.canvas);
        } catch (error) {
          console.warn('Aurora canvas cleanup error:', error);
        }
      }
      
      // Dispose WebGL resources
      try {
        // Lose WebGL context to free memory
        const loseContext = renderer?.gl?.getExtension("WEBGL_lose_context");
        loseContext?.loseContext();
        
        // Clear references
        program = null;
        mesh = null;
        renderer = null;
      } catch (error) {
        console.warn('Aurora WebGL cleanup error:', error);
      }
    };
  }, [amplitude, theme]);

  return <div ref={ctnDom} className="w-full h-full" />;
} 