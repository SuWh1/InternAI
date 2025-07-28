import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, User, Code, Briefcase, Target, Rocket, Sparkles, Search, X, ChevronDown, BookOpen, Zap } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import TextAreaWithCounter from '../components/common/TextAreaWithCounter';
import type { OnboardingFormData, OnboardingOptions } from '../types/onboarding';

// LocalStorage key for persisting onboarding data
const ONBOARDING_STORAGE_KEY = 'internai_onboarding_draft';
const STORAGE_VERSION = '1.0';

// Interface for stored onboarding data
interface StoredOnboardingData {
  version: string;
  timestamp: number;
  formData: OnboardingFormData;
  currentStep: number;
  currentSubStep: number;
  selectedRecommendedPath: string;
  otherMajor: string;
  // Full-Stack specific state
  backendLanguage: string;
  frontendLanguage: string;
  backendFramework: string;
  frontendFramework: string;
}

// LocalStorage helper functions
const saveOnboardingToStorage = (data: Partial<StoredOnboardingData>) => {
  try {
    const existingData = loadOnboardingFromStorage();
    const dataToSave: StoredOnboardingData = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      formData: existingData?.formData || {
        current_year: '',
        major: '',
        programming_languages: [],
        frameworks: [],
        tools: [],
        preferred_tech_stack: '',
        experience_level: '',
        skill_confidence: '',
        has_internship_experience: false,
        previous_internships: '',
        projects: '',
        target_roles: [],
        preferred_company_types: [],
        preferred_locations: [],
        application_timeline: '',
        additional_info: '',
        source_of_discovery: ''
      },
      currentStep: existingData?.currentStep || 1,
      currentSubStep: existingData?.currentSubStep || 1,
      selectedRecommendedPath: existingData?.selectedRecommendedPath || '',
      otherMajor: existingData?.otherMajor || '',
      // Full-Stack specific state
      backendLanguage: existingData?.backendLanguage || '',
      frontendLanguage: existingData?.frontendLanguage || '',
      backendFramework: existingData?.backendFramework || '',
      frontendFramework: existingData?.frontendFramework || '',
      ...data
    };
    
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.warn('Failed to save onboarding data to localStorage:', error);
  }
};

const loadOnboardingFromStorage = (): StoredOnboardingData | null => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as StoredOnboardingData;
    
    // Validate version and structure
    if (data.version !== STORAGE_VERSION) {
      console.warn('Onboarding data version mismatch, clearing storage');
      clearOnboardingFromStorage();
      return null;
    }
    
    // Validate required fields exist
    if (!data.formData || !data.currentStep) {
      console.warn('Invalid onboarding data structure, clearing storage');
      clearOnboardingFromStorage();
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Failed to load onboarding data from localStorage:', error);
    clearOnboardingFromStorage();
    return null;
  }
};

const clearOnboardingFromStorage = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear onboarding data from localStorage:', error);
  }
};

// Tech Stack Mappings - Comprehensive mapping of stacks to their relevant technologies
const TECH_STACK_MAPPINGS = {
  'Full-Stack Web Development': {
    languages: {
      'JavaScript': {
        frameworks: ['React', 'Vue.js', 'Angular', 'Next.js', 'Express', 'Node.js', 'Nuxt.js'],
        tools: ['npm', 'Yarn', 'Webpack', 'Vite', 'ESLint', 'Prettier', 'Postman', 'Chrome DevTools']
      },
      'TypeScript': {
        frameworks: ['React', 'Next.js', 'NestJS', 'Angular', 'Express'],
        tools: ['npm', 'Yarn', 'ESLint', 'Prettier', 'Vite', 'ts-node', 'Postman']
      },
      'Python': {
        frameworks: ['Django', 'Flask', 'FastAPI', 'Tornado'],
        tools: ['pip', 'Poetry', 'Postman', 'PyCharm', 'Black', 'isort']
      },
      'Java': {
        frameworks: ['Spring', 'Spring Boot', 'Micronaut'],
        tools: ['Maven', 'Gradle', 'IntelliJ IDEA', 'Eclipse', 'Postman']
      },
      'C#': {
        frameworks: ['ASP.NET', 'ASP.NET Core'],
        tools: ['Visual Studio', 'Postman', 'NuGet', 'LINQPad']
      },
      'Go': {
        frameworks: ['Gin', 'Fiber', 'Echo', 'Beego'],
        tools: ['GoLand', 'Delve', 'Postman', 'Air (live reload)', 'Swagger']
      },
      'PHP': {
        frameworks: ['Laravel', 'Symfony', 'CodeIgniter'],
        tools: ['Composer', 'PHPStorm', 'Postman', 'Xdebug']
      },
      'Ruby': {
        frameworks: ['Ruby on Rails', 'Sinatra'],
        tools: ['Bundler', 'Postman', 'Pry', 'RuboCop']
      }
    },
    commonTools: [
      'Git', 'Docker', 'Docker Compose', 'AWS', 'GCP', 'Azure', 'Kubernetes',
      'VS Code', 'WebStorm', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'Prisma', 'Sequelize', 'Figma', 'HTML', 'CSS', 'Tailwind CSS', 'Sass/SCSS',
      'Heroku', 'Netlify', 'Vercel', 'Nginx', 'CI/CD (GitHub Actions, CircleCI)'
    ]
  },
  'Frontend Development': {
    languages: {
      'JavaScript': {
        frameworks: [
          'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Gatsby',
          'Ember.js', 'Remix', 'Qwik', 'Astro', 'Svelte', 'Solid.js'
        ],
        tools: [
          'npm', 'Webpack', 'Vite', 'Babel', 'VS Code', 'Chrome DevTools',
          'Figma', 'Git', 'ESLint', 'Prettier', 'Netlify', 'Vercel'
        ]
      },
      'TypeScript': {
        frameworks: [
          'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte',
          'SvelteKit', 'Remix', 'Qwik', 'Solid.js', 'Astro'
        ],
        tools: [
          'npm', 'Webpack', 'Vite', 'ESLint', 'Prettier', 'VS Code',
          'Git', 'Netlify', 'Vercel'
        ]
      },
      'Dart': {
        frameworks: ['Flutter (Web)'],
        tools: ['VS Code', 'Figma', 'Flutter DevTools', 'DartPad']
      },
      'C#': {
        frameworks: ['Blazor'],
        tools: ['Visual Studio', 'Git', 'Rider', 'Live Server']
      },
      'Java': {
        frameworks: ['Vaadin', 'GWT'],
        tools: ['IntelliJ IDEA', 'Git', 'NetBeans']
      },
      'Go': {
        frameworks: ['Vugu'],
        tools: ['VS Code', 'Git', 'GoLand']
      },
      'Rust': {
        frameworks: ['Yew', 'Seed', 'Dioxus'],
        tools: ['VS Code', 'Git', 'Trunk']
      }
    },
    commonTools: [
      'HTML', 'CSS', 'Sass/SCSS', 'Figma', 'Adobe XD', 'Sketch',
      'Netlify', 'Vercel', 'Chrome DevTools'
    ]
  },
  'Backend Development': {
    Python: {
      frameworks: ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Bottle', 'CherryPy', 'Sanic', 'Falcon', 'Responder', 'Quart', 'BlackSheep', 'Starlette', 'Litestar', 'Robyn', 'Hug'],
      tools: ['Celery', 'gRPC', 'SQLAlchemy', 'Alembic', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Java: {
      frameworks: ['Spring', 'Micronaut', 'Dropwizard', 'Javalin', 'Quarkus'],
      tools: ['Hibernate', 'gRPC', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    'C#': {
      frameworks: ['ASP.NET Core'],
      tools: ['Entity Framework', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Go: {
      frameworks: ['Gin', 'Echo', 'Fiber', 'Beego', 'Buffalo', 'Gorilla', 'Chi', 'Iris', 'Revel'],
      tools: ['gRPC', 'Go-SQLite3', 'Ent', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Rust: {
      frameworks: ['Actix-web', 'Rocket', 'Axum', 'Warp', 'Tide'],
      tools: ['Diesel', 'SeaORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    PHP: {
      frameworks: ['Laravel', 'Symfony', 'CodeIgniter', 'Yii', 'Zend'],
      tools: ['Eloquent ORM', 'Doctrine', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Ruby: {
      frameworks: ['Ruby on Rails', 'Sinatra', 'Hanami'],
      tools: ['Active Record', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Scala: {
      frameworks: ['Play Framework', 'Akka HTTP', 'http4s'],
      tools: ['Slick', 'Doobie', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Kotlin: {
      frameworks: ['Ktor', 'Spring Boot'],
      tools: ['Exposed ORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Elixir: {
      frameworks: ['Phoenix'],
      tools: ['Ecto', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    JavaScript: {
      frameworks: ['Express', 'NestJS', 'Hapi', 'Koa'],
      tools: ['Mongoose', 'Sequelize', 'TypeORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    TypeScript: {
      frameworks: ['Express', 'NestJS', 'Fastify'],
      tools: ['Prisma', 'TypeORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    'C++': {
      frameworks: ['CppCMS', 'Crow', 'Pistache', 'Wt'],
      tools: ['SOCI', 'ODB', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    tools: [
      'Docker', 'Kubernetes', 'AWS', 'Postman', 'Git', 'Jenkins',
      'VS Code', 'IntelliJ IDEA', 'PyCharm', 'Heroku', 'Prometheus', 'Grafana',
      'RabbitMQ', 'Kafka', 'Consul', 'Nginx'
    ]
  },
  'Mobile Development': {
    languages: {
      'Swift': {
        frameworks: ['SwiftUI', 'UIKit', 'Combine'],
        tools: ['Xcode', 'TestFlight', 'Instruments', 'CocoaPods', 'SwiftLint']
      },
      'Kotlin': {
        frameworks: ['Jetpack Compose', 'Ktor'],
        tools: ['Android Studio', 'Play Console', 'Gradle', 'Firebase', 'LeakCanary']
      },
      'Java': {
        frameworks: ['Android SDK'],
        tools: ['Android Studio', 'Gradle', 'Firebase', 'Lint']
      },
      'JavaScript': {
        frameworks: ['React Native', 'Expo'],
        tools: ['React Native CLI', 'VS Code', 'Metro Bundler', 'ESLint']
      },
      'TypeScript': {
        frameworks: ['React Native', 'Expo'],
        tools: ['VS Code', 'TypeScript ESLint']
      },
      'Dart': {
        frameworks: ['Flutter'],
        tools: ['Android Studio', 'VS Code', 'Dart DevTools', 'Flutter Inspector']
      },
      'C#': {
        frameworks: ['Xamarin', 'Unity'],
        tools: ['Visual Studio', 'NuGet', 'Unity Hub']
      }
    },
    commonTools: [
      'Git', 'Firebase', 'Supabase', 'Figma', 'Netlify',
      'Vercel', 'Heroku', 'Bitrise', 'Codemagic', 'App Center'
    ]
  },
  'Data Science & Analytics': {
    languages: {
      'Python': {
        frameworks: ['Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'Dask', 'Flask', 'Django', 'FastAPI'],
        tools: ['Jupyter', 'VS Code', 'PyCharm', 'MLflow', 'Apache Airflow']
      },
      'R': {
        frameworks: ['tidyverse', 'Shiny', 'caret'],
        tools: ['RStudio', 'Jupyter', 'Tableau']
      },
      'SQL': {
        frameworks: [],
        tools: ['PostgreSQL', 'MongoDB', 'Redis']
      },
      'Scala': {
        frameworks: ['Apache Spark'],
        tools: ['Jupyter', 'VS Code', 'Databricks']
      },
      'Julia': {
        frameworks: ['Flux.jl', 'MLJ.jl'],
        tools: ['Jupyter', 'VS Code']
      },
      'MATLAB': {
        frameworks: [],
        tools: ['MATLAB IDE']
      },
      'Java': {
        frameworks: ['Apache Spark', 'Deeplearning4j', 'Weka'],
        tools: ['Jupyter', 'IntelliJ IDEA']
      },
      'C++': {
        frameworks: ['Dlib', 'Shark'],
        tools: ['Jupyter', 'Visual Studio']
      },
      'JavaScript': {
        frameworks: ['TensorFlow.js', 'Brain.js', 'Danfo.js'],
        tools: ['VS Code']
      }
    },
    commonTools: ['Docker', 'AWS', 'Git', 'Tableau', 'Databricks', 'Prometheus', 'Grafana']
  },
  'Machine Learning & AI': {
    languages: {
      'Python': {
        frameworks: [
          'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
          'Pandas', 'NumPy', 'Hugging Face', 'LangChain', 'OpenAI', 'Transformers', 'JAX'
        ],
        tools: [
          'Jupyter', 'VS Code', 'PyCharm', 'MLflow', 'Weights & Biases', 'TensorBoard', 'Docker', 'CUDA'
        ]
      },
      'R': {
        frameworks: ['caret', 'mlr', 'tensorflow'],
        tools: ['RStudio', 'Jupyter']
      },
      'Julia': {
        frameworks: ['Flux.jl', 'MLJ.jl'],
        tools: ['Jupyter', 'VS Code']
      },
      'C++': {
        frameworks: ['TensorFlow', 'Torch C++', 'Dlib'],
        tools: ['Visual Studio', 'CUDA']
      },
      'JavaScript': {
        frameworks: ['TensorFlow.js', 'Brain.js'],
        tools: ['VS Code']
      },
      'Java': {
        frameworks: ['DeepLearning4J', 'Weka'],
        tools: ['IntelliJ IDEA']
      },
      'Scala': {
        frameworks: ['Apache Spark MLlib'],
        tools: ['Databricks']
      },
      'Swift': {
        frameworks: ['Core ML', 'Create ML'],
        tools: ['Xcode']
      },
      'C#': {
        frameworks: ['ML.NET'],
        tools: ['Visual Studio']
      }
    },
    commonTools: ['Git', 'Docker', 'AWS', 'Google Cloud', 'Azure', 'Databricks']
  },
  'DevOps & Cloud Infrastructure': {
    languages: {
      'Python': {
        frameworks: ['Ansible', 'Fabric'],
        tools: ['Docker', 'Jenkins', 'Git', 'Prometheus', 'Grafana', 'Vault', 'VS Code', 'GitHub Actions', 'AWS SDK', 'Azure SDK']
      },
      'Go': {
        frameworks: [],
        tools: ['Docker', 'Kubernetes', 'Prometheus', 'Grafana', 'Consul', 'Vault', 'Terraform', 'Git']
      },
      'JavaScript': {
        frameworks: ['Node.js', 'Express'],
        tools: ['VS Code', 'GitHub Actions', 'ESLint', 'npm', 'Docker']
      },
      'Bash': {
        frameworks: [],
        tools: ['Git', 'Docker', 'Jenkins', 'Kubernetes', 'Ansible', 'Helm']
      },
      'PowerShell': {
        frameworks: [],
        tools: ['Azure CLI', 'Windows Server Automation', 'GitHub Actions', 'AWS Tools for PowerShell']
      },
      'Java': {
        frameworks: ['Spring Boot'],
        tools: ['Jenkins', 'Docker', 'Git', 'Maven', 'VS Code', 'IntelliJ', 'Kubernetes']
      },
      'C#': {
        frameworks: ['.NET Core'],
        tools: ['Azure DevOps', 'GitHub Actions', 'Docker', 'VS Code', 'Visual Studio']
      },
      'Ruby': {
        frameworks: ['Rails'],
        tools: ['Chef', 'Puppet', 'GitLab CI', 'Capistrano']
      },
      'Rust': {
        frameworks: [],
        tools: ['Docker', 'Git', 'GitHub Actions', 'cargo-make']
      }
    },
    commonTools: [
      'Docker', 'AWS', 'Azure', 'Google Cloud', 'Kubernetes',
      'Terraform', 'Ansible', 'Helm', 'Jenkins', 'GitHub Actions', 'GitLab CI',
      'Vault', 'Consul', 'Prometheus', 'Grafana',
      'PostgreSQL', 'MongoDB', 'Redis', 'VS Code', 'Git'
    ]
  },
'Cybersecurity': {
  languages: {
    'Python': {
        frameworks: ['Flask', 'Django', 'Mitmproxy', 'Python-nmap', 'PyShark'],
      tools: ['Scapy', 'pwntools', 'Impacket', 'Burp Suite API', 'Volatility', 'PyCrypto', 'Git', 'VS Code']
    },
    'C': {
      frameworks: [],
      tools: ['GDB', 'Radare2', 'Wireshark', 'Nmap', 'Metasploit', 'Valgrind', 'Make', 'Git']
    },
    'C++': {
      frameworks: [],
      tools: ['Ghidra', 'IDA Pro', 'Wireshark', 'Burp Suite', 'Nmap', 'Clang', 'CMake', 'Git']
    },
    'Java': {
      frameworks: ['Spring Security'],
      tools: ['Burp Suite', 'OWASP ZAP', 'Keycloak', 'Git', 'VS Code', 'IntelliJ']
    },
    'JavaScript': {
      frameworks: ['Node.js', 'Express'],
      tools: ['OWASP ZAP', 'Postman', 'Burp Suite', 'npm', 'ESLint', 'Git']
    },
    'Go': {
      frameworks: [],
      tools: ['Amass', 'httprobe', 'Gobuster', 'Git', 'VS Code']
    },
    'Rust': {
      frameworks: [],
      tools: ['cargo-audit', 'Clippy', 'Git', 'VS Code']
    },
    'PowerShell': {
      frameworks: [],
      tools: ['PowerSploit', 'Empire', 'Windows Defender Evasion', 'Git']
    },
    'Bash': {
      frameworks: [],
      tools: ['Nmap', 'Netcat', 'tcpdump', 'iptables', 'Git']
    }
  },
  commonTools: [
    'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 'OWASP ZAP',
    'Kali Linux', 'Parrot OS', 'Docker', 'VS Code', 'Git',
    'PostgreSQL', 'MongoDB', 'MySQL', 'Postman',
    'Ghidra', 'IDA Pro', 'Volatility', 'John the Ripper',
    'Aircrack-ng', 'Nikto', 'Snort', 'Suricata'
  ]
},
'Game Development': {
  languages: {
    'C#': {
      frameworks: ['Unity'],
      tools: ['Visual Studio', 'Unity', 'Rider', 'VS Code', 'Git']
    },
    'C++': {
      frameworks: ['Unreal Engine'],
      tools: ['Visual Studio', 'Unreal Editor', 'Blender', 'Perforce', 'Git']
    },
    'JavaScript': {
        frameworks: ['Phaser', 'Three.js', 'Babylon.js', 'PlayCanvas', 'Godot'],
      tools: ['VS Code', 'npm', 'Webpack', 'Git']
    },
    'TypeScript': {
      frameworks: ['Phaser', 'Three.js'],
      tools: ['VS Code', 'npm', 'Webpack', 'Git']
    },
    'Python': {
        frameworks: ['Pygame', 'Ursina', 'Godot'],
      tools: ['Blender (scripting)', 'VS Code', 'Git']
    },
    'GDScript': {
      frameworks: ['Godot'],
      tools: ['Godot Editor', 'Git']
    },
    'Lua': {
        frameworks: ['Love2D', 'Defold', 'Solar2D'],
      tools: ['ZeroBrane Studio', 'VS Code', 'Git']
    },
    'Java': {
      frameworks: ['libGDX'],
      tools: ['IntelliJ', 'VS Code', 'Git']
    },
    'Rust': {
        frameworks: ['Bevy', 'Fyrox', 'Macroquad'],  
      tools: ['VS Code', 'cargo', 'Git']
    }
  },
  commonTools: [
    'Unity', 'Unreal Engine', 'Godot',
    'Blender', 'Maya', 'Photoshop',
    'VS Code', 'Visual Studio', 'IntelliJ', 'Rider',
    'Git', 'Perforce',
    'Steam SDK',
    'npm', 'Webpack',
      'HTML', 'CSS',
      'Tiled', 'Aseprite'
  ]
},
'Blockchain & Web3': {
  languages: {
    'Solidity': {
      frameworks: ['Hardhat', 'Truffle', 'Foundry'],
      tools: ['Remix IDE', 'Ganache', 'Metamask', 'Ethers.js', 'Web3.js', 'VS Code', 'Git']
    },
    'JavaScript': {
      frameworks: ['React', 'Vue.js', 'Next.js', 'Node.js', 'Express'],
      tools: ['Web3.js', 'Ethers.js', 'Metamask', 'VS Code', 'npm', 'Git']
    },
    'TypeScript': {
      frameworks: ['Next.js', 'React', 'Node.js', 'Express'],
      tools: ['Ethers.js', 'Hardhat', 'VS Code', 'npm', 'Git']
    },
    'Python': {
        frameworks: ['Brownie'],
      tools: ['Web3.py', 'VS Code', 'Git']
    },
    'Rust': {
      frameworks: ['Anchor', 'Near SDK'],
      tools: ['Solana CLI', 'cargo', 'VS Code', 'Git']
    },
    'Go': {
      frameworks: ['Hyperledger Fabric SDK Go', 'Go-Ethereum'],
      tools: ['Docker', 'VS Code', 'Git']
    },
    'C++': {
      frameworks: ['EOSIO', 'Bitcoin Core'],
      tools: ['Clang', 'Make', 'VS Code', 'Git']
    },
    'Java': {
      frameworks: ['Web3j', 'Spring'],
      tools: ['VS Code', 'IntelliJ', 'Git']
    }
  },
  commonTools: [
    'Metamask', 'Remix IDE', 'Ganache',
    'Web3.js', 'Ethers.js', 'Web3.py',
    'Git', 'VS Code', 'Docker', 'AWS',
      'PostgreSQL', 'MongoDB', 'The Graph',
      'npm', 'Foundry', 'Hardhat',
      'IPFS', 'Chainlink', 'Alchemy', 'Infura'
  ]
},
'Desktop Applications': {
  languages: {
    'C#': {
      frameworks: ['.NET', 'WPF', 'WinForms'],
      tools: ['Visual Studio', 'Resharper', 'Git']
    },
    'C++': {
      frameworks: ['Qt', 'wxWidgets', 'MFC'],
      tools: ['Qt Creator', 'Visual Studio', 'CMake', 'Git']
    },
    'Java': {
      frameworks: ['JavaFX', 'Swing', 'SWT'],
      tools: ['IntelliJ IDEA', 'Eclipse', 'Git']
    },
    'Python': {
      frameworks: ['PyQt', 'Tkinter', 'Kivy'],
      tools: ['VS Code', 'PyCharm', 'Git']
    },
    'JavaScript': {
      frameworks: ['Electron'],
      tools: ['VS Code', 'npm', 'Webpack', 'Git']
    },
    'TypeScript': {
      frameworks: ['Electron', 'Tauri'],
      tools: ['VS Code', 'npm', 'Vite', 'Git']
    },
    'Rust': {
      frameworks: ['Tauri', 'druid'],
      tools: ['cargo', 'VS Code', 'Git']
    },
    'Go': {
      frameworks: ['Fyne', 'Wails'],
      tools: ['VS Code', 'GoLand', 'Git']
    },
    'Swift': {
      frameworks: ['SwiftUI', 'AppKit', 'UIKit'],
      tools: ['Xcode', 'Git']
    }
  },
  commonTools: [
    'Visual Studio', 'VS Code', 'IntelliJ IDEA', 'Qt Creator', 'Xcode',
    'Git', 'Docker', 'npm', 'Webpack', 'Vite', 'Figma'
  ]
},
'Embedded Systems & IoT': {
  languages: {
    'C': {
        frameworks: ['Arduino', 'FreeRTOS', 'Zephyr', 'CMSIS', 'ChibiOS', 'STM32 HAL', 'LL'] ,
        tools: ['PlatformIO', 'Arduino IDE', 'Make', 'OpenOCD', 'STM32CubeIDE', 'GCC ARM Toolchain']
    },
    'C++': {
      frameworks: ['Arduino', 'ESP-IDF', 'mbed OS', 'Zephyr'],
      tools: ['PlatformIO', 'VS Code', 'Qt Creator', 'J-Link']
    },
    'Python': {
      frameworks: ['MicroPython', 'CircuitPython', 'Raspberry Pi GPIO'],
      tools: ['Thonny', 'VS Code', 'Jupyter']
    },
    'Rust': {
      frameworks: ['RTIC', 'embassy', 'Zephyr'],
      tools: ['cargo', 'probe-rs', 'VS Code']
    },
    'Assembly': {
      frameworks: [],
      tools: ['AVR Studio', 'Keil uVision', 'GDB']
    },
    'JavaScript': {
      frameworks: ['Johnny-Five', 'Node.js', 'Express'],
      tools: ['VS Code', 'npm', 'Git']
    },
    'Java': {
      frameworks: ['Android Things', 'Pi4J'],
        tools: ['Android Studio', 'VS Code', 'Eclipse IDE']
    },
    'Go': {
      frameworks: ['TinyGo'],
      tools: ['VS Code', 'Docker']
    }
  },
  commonTools: [
    'Arduino IDE', 'PlatformIO', 'VS Code', 'Git', 'Docker',
      'MQTT', 'InfluxDB', 'Grafana', 'AWS IoT', 'Firebase',
      'Balena', 'Node-RED', 'Zigbee2MQTT', 'Home Assistant', 'Wireshark'
  ]
},
'I am new to programming': {
    recommendedPaths: {
      frontend: {
        steps: ['HTML', 'CSS', 'JavaScript', 'React'],
        tools: ['VS Code', 'Chrome DevTools', 'GitHub'],
        explanation: 'Build websites that users can see and interact with.'
      },
      backend: {
        steps: ['Python', 'Flask', 'APIs', 'PostgreSQL'],
        tools: ['VS Code', 'Postman', 'Git'],
        explanation: 'Create the behind-the-scenes logic that powers websites and apps.'
      },
      fullstack: {
        steps: ['JavaScript', 'React', 'Express', 'PostgreSQL'],
        tools: ['GitHub', 'VS Code', 'Postman'],
        explanation: 'Build both the website design and the logic behind it.'
      },
      machineLearningAI: {
        steps: ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'Neural Networks'],
        tools: ['Jupyter Notebook', 'VS Code', 'Google Colab'],
        explanation: 'Teach computers to learn from data and make smart decisions.'
      },
      mobile: {
        steps: ['Dart', 'Flutter', 'Widgets', 'Firebase'],
        tools: ['Android Studio', 'Flutter DevTools', 'VS Code'],
        explanation: 'Make apps that work on both Android and iOS.'
      },
      gameDev: {
        steps: ['C#', 'Unity', '2D Games', 'Physics', 'Game Assets'],
        tools: ['Unity Editor', 'Visual Studio', 'Git'],
        explanation: 'Create your own games with graphics, controls, and sound.'
      }
  }
},
};

// Comprehensive list of major cities worldwide
const WORLD_CITIES = [
  // North America
  'New York City, United States', 'Los Angeles, United States', 'Chicago, United States', 'Houston, United States',
  'Phoenix, United States', 'Philadelphia, United States', 'San Antonio, United States', 'San Diego, United States',
  'Dallas, United States', 'San Jose, United States', 'Austin, United States', 'Jacksonville, United States',
  'San Francisco, United States', 'Columbus, United States', 'Charlotte, United States', 'Fort Worth, United States',
  'Detroit, United States', 'El Paso, United States', 'Memphis, United States', 'Seattle, United States',
  'Denver, United States', 'Washington, United States', 'Boston, United States', 'Nashville, United States',
  'Baltimore, United States', 'Oklahoma City, United States', 'Louisville, United States', 'Portland, United States',
  'Las Vegas, United States', 'Milwaukee, United States', 'Albuquerque, United States', 'Tucson, United States',
  'Fresno, United States', 'Sacramento, United States', 'Mesa, United States', 'Kansas City, United States',
  'Atlanta, United States', 'Long Beach, United States', 'Colorado Springs, United States', 'Raleigh, United States',
  'Miami, United States', 'Virginia Beach, United States', 'Omaha, United States', 'Oakland, United States',
  'Minneapolis, United States', 'Tulsa, United States', 'Arlington, United States', 'Tampa, United States',
  'Toronto, Canada', 'Montreal, Canada', 'Calgary, Canada', 'Ottawa, Canada', 'Edmonton, Canada', 'Mississauga, Canada',
  'Winnipeg, Canada', 'Vancouver, Canada', 'Brampton, Canada', 'Hamilton, Canada', 'Quebec City, Canada', 'Surrey, Canada',
  'Laval, Canada', 'Halifax, Canada', 'London, Canada', 'Markham, Canada', 'Vaughan, Canada', 'Gatineau, Canada',
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Puebla, Mexico', 'Tijuana, Mexico', 'León, Mexico',
  
  // Europe
  'London, United Kingdom', 'Birmingham, United Kingdom', 'Manchester, United Kingdom', 'Glasgow, United Kingdom',
  'Liverpool, United Kingdom', 'Leeds, United Kingdom', 'Sheffield, United Kingdom', 'Edinburgh, United Kingdom',
  'Bristol, United Kingdom', 'Cardiff, United Kingdom', 'Belfast, United Kingdom', 'Leicester, United Kingdom',
  'Berlin, Germany', 'Hamburg, Germany', 'Munich, Germany', 'Cologne, Germany', 'Frankfurt, Germany', 'Stuttgart, Germany',
  'Düsseldorf, Germany', 'Leipzig, Germany', 'Dortmund, Germany', 'Essen, Germany', 'Bremen, Germany', 'Dresden, Germany',
  'Paris, France', 'Marseille, France', 'Lyon, France', 'Toulouse, France', 'Nice, France', 'Nantes, France',
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain', 'Zaragoza, Spain', 'Málaga, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Palermo, Italy', 'Genoa, Italy',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium', 'Charleroi, Belgium',
  'Vienna, Austria', 'Graz, Austria', 'Linz, Austria', 'Salzburg, Austria',
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Bern, Switzerland',
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden', 'Uppsala, Sweden',
  'Oslo, Norway', 'Bergen, Norway', 'Stavanger, Norway', 'Trondheim, Norway',
  'Copenhagen, Denmark', 'Aarhus, Denmark', 'Odense, Denmark', 'Aalborg, Denmark',
  'Helsinki, Finland', 'Espoo, Finland', 'Tampere, Finland', 'Vantaa, Finland',
  'Warsaw, Poland', 'Kraków, Poland', 'Łódź, Poland', 'Wrocław, Poland',
  'Prague, Czech Republic', 'Brno, Czech Republic', 'Ostrava, Czech Republic',
  'Budapest, Hungary', 'Debrecen, Hungary', 'Szeged, Hungary',
  'Bucharest, Romania', 'Cluj-Napoca, Romania', 'Timișoara, Romania',
  'Athens, Greece', 'Thessaloniki, Greece', 'Patras, Greece',
  'Lisbon, Portugal', 'Porto, Portugal', 'Vila Nova de Gaia, Portugal',
  'Dublin, Ireland', 'Cork, Ireland', 'Limerick, Ireland',
  'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia',
  
  // Asia
  'Tokyo, Japan', 'Yokohama, Japan', 'Osaka, Japan', 'Nagoya, Japan', 'Sapporo, Japan', 'Fukuoka, Japan',
  'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China', 'Tianjin, China', 'Wuhan, China',
  'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea',
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India', 'Chennai, India', 'Kolkata, India',
  'Singapore, Singapore', 'Kuala Lumpur, Malaysia', 'Bangkok, Thailand', 'Manila, Philippines',
  'Jakarta, Indonesia', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  'Hong Kong, Hong Kong', 'Taipei, Taiwan', 'Tel Aviv, Israel',
  
  // Australia & Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
  
  // South America
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil', 'Fortaleza, Brazil',
  'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina',
  'Lima, Peru', 'Bogotá, Colombia', 'Santiago, Chile', 'Caracas, Venezuela',
  
  // Africa
  'Cairo, Egypt', 'Lagos, Nigeria', 'Kinshasa, Democratic Republic of the Congo', 'Johannesburg, South Africa',
  'Luanda, Angola', 'Dar es Salaam, Tanzania', 'Khartoum, Sudan', 'Algiers, Algeria',
  'Cape Town, South Africa', 'Nairobi, Kenya', 'Casablanca, Morocco',
  
  // Special
  'Remote'
];

// LocationAutocomplete component
const LocationAutocomplete: React.FC<{
  selectedLocations: string[];
  onChange: (locations: string[]) => void;
}> = ({ selectedLocations, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = WORLD_CITIES.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [searchTerm]);

  const handleCitySelect = (city: string) => {
    if (!selectedLocations.includes(city)) {
      onChange([...selectedLocations, city]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCityRemove = (city: string) => {
    onChange(selectedLocations.filter(loc => loc !== city));
  };

  return (
    <div className="space-y-3">
      {/* Selected locations */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLocations.map((location) => (
            <span
              key={location}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
            >
              {location}
              <button
                onClick={() => handleCityRemove(location)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for cities..."
            className="w-full pl-10 pr-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary"
          />
        </div>
        
        {/* Dropdown */}
        {isOpen && filteredCities.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {filteredCities.map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-theme-primary transition-colors duration-200"
                disabled={selectedLocations.includes(city)}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Select Component with animated dropdown arrow
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
}> = ({ value, onChange, placeholder, options, disabled = false, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        disabled={disabled}
        className="w-full px-4 py-3 pr-12 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm appearance-none cursor-pointer"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      {/* Custom animated dropdown arrow */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown 
          className={`w-5 h-5 text-purple-500 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
          }`}
        />
      </div>
    </div>
  );
};

// Helper component for custom checkbox/radio
const CustomSelector: React.FC<{
  type: 'checkbox' | 'radio';
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  name?: string;
  color?: 'blue' | 'green' | 'purple';
  dimmed?: boolean;
  disabled?: boolean;
  tooltip?: string;
}> = ({ type, id, label, checked, onChange, name, color = 'blue', dimmed = false, disabled = false, tooltip }) => {
  return (
    <div className={`relative ${tooltip ? 'group' : ''}`}>
      <label 
        htmlFor={id} 
        className={`
          flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 group
          ${disabled 
            ? 'border-theme bg-theme-secondary opacity-60 cursor-not-allowed' 
            : 'border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }
          ${dimmed && !disabled ? 'opacity-50' : ''}
        `}
      >
        <input
          type={type}
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all duration-200
          ${checked 
            ? 'bg-purple-500 border-purple-500' 
            : disabled 
              ? 'bg-theme-secondary border-theme opacity-75'
              : 'bg-theme-secondary border-purple-300 dark:border-purple-600'
          }
        `}>
          {checked && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className={`
          font-medium transition-colors duration-200
          ${disabled 
            ? 'text-theme-secondary' 
            : 'text-theme-primary group-hover:text-purple-600 dark:group-hover:text-purple-400'
          }
        `}>
          {label}
        </span>
      </label>
      
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-theme-primary text-theme-secondary text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-theme">
          {tooltip}
        </div>
      )}
    </div>
  );
};

// Sub-step progress indicator for step 2
const SubStepIndicator: React.FC<{
  currentSubStep: number;
  totalSubSteps: number;
  subStepNames: string[];
}> = ({ currentSubStep, totalSubSteps, subStepNames }) => (
  <div className="flex items-center justify-center mb-6 sm:mb-8 px-4">
    {Array.from({ length: totalSubSteps }, (_, i) => (
      <React.Fragment key={i}>
        <div className={`
          relative flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs font-semibold transition-all duration-300
          ${i + 1 <= currentSubStep 
            ? 'bg-purple-500 text-white shadow-md' 
            : 'bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary'
          }
        `}>
          {i + 1 < currentSubStep ? (
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <span className="text-xs">{i + 1}</span>
          )}
        </div>
        {i < totalSubSteps - 1 && (
          <div className={`
            w-4 sm:w-6 md:w-8 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-300
            ${i + 1 < currentSubStep ? 'bg-purple-500' : 'bg-theme-hover'}
          `} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { createOnboarding, getOnboardingOptions, loading, error } = useOnboarding();
  
  const topOfPageRef = React.useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [otherMajor, setOtherMajor] = useState('');
  
  // Sub-step management for step 2 (Technical Background)
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [selectedRecommendedPath, setSelectedRecommendedPath] = useState('');
  
  // Full-Stack language selection state
  const [backendLanguage, setBackendLanguage] = useState('');
  const [frontendLanguage, setFrontendLanguage] = useState('');
  
  // Full-Stack framework selection state
  const [backendFramework, setBackendFramework] = useState('');
  const [frontendFramework, setFrontendFramework] = useState('');
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Step 1: Personal Information
    current_year: '',
    major: '',
    
    // Step 2: Technical Background
    programming_languages: [],
    frameworks: [],
    tools: [],
    preferred_tech_stack: '',
    experience_level: '',
    skill_confidence: '',
    
    // Step 3: Experience
    has_internship_experience: false,
    previous_internships: '',
    projects: '',
    
    // Step 4: Career Goals
    target_roles: [],
    preferred_company_types: [],
    preferred_locations: [],
    
    // Step 5: Final Touches & Timeline
    application_timeline: '',
    additional_info: '',
    source_of_discovery: ''
  });

  const totalSteps = 5;

  // Dynamic sub-step calculation based on tech stack selection
  const isNewToProgramming = React.useMemo(() => formData.preferred_tech_stack === 'I am new to programming', [formData.preferred_tech_stack]);
  const isFullStack = React.useMemo(() => formData.preferred_tech_stack === 'Full-Stack Web Development', [formData.preferred_tech_stack]);
  const subStepNames = React.useMemo(() => isNewToProgramming ? ['Tech Stack', 'Learning Path', 'Experience'] : ['Tech Stack', 'Languages', 'Frameworks', 'Tools', 'Experience'], [isNewToProgramming]);
  const totalSubSteps = React.useMemo(() => isNewToProgramming ? 3 : 5, [isNewToProgramming]);

  // Helper functions for Full-Stack language categorization
  const getBackendLanguages = () => {
    return ['Python', 'Java', 'C#', 'Go', 'PHP', 'Ruby'];
  };

  const getFrontendLanguages = () => {
    return ['JavaScript', 'TypeScript'];
  };

  // Helper functions for Full-Stack framework categorization
  const getBackendFrameworks = () => {
    if (!backendLanguage || !isFullStack) return [];
    const mapping = TECH_STACK_MAPPINGS[formData.preferred_tech_stack as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping?.languages?.[backendLanguage]?.frameworks) return [];
    return mapping.languages[backendLanguage].frameworks;
  };

  const getFrontendFrameworks = () => {
    if (!frontendLanguage || !isFullStack) return [];
    const mapping = TECH_STACK_MAPPINGS[formData.preferred_tech_stack as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping?.languages?.[frontendLanguage]?.frameworks) return [];
    return mapping.languages[frontendLanguage].frameworks;
  };

  // Helper functions for filtering options based on tech stack
  const getRelevantLanguages = () => {
    if (!formData.preferred_tech_stack) return [];
    const mapping = TECH_STACK_MAPPINGS[formData.preferred_tech_stack as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping) return [];
    
    // Special handling for "I am new to programming"
    if (formData.preferred_tech_stack === 'I am new to programming') {
      // If a path is selected, return languages from that path
      if (selectedRecommendedPath && mapping.recommendedPaths?.[selectedRecommendedPath]) {
        const pathData = mapping.recommendedPaths[selectedRecommendedPath];
        if (pathData.steps && Array.isArray(pathData.steps)) {
          return pathData.steps.filter((item: string) => 
            ['HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'Dart'].includes(item)
          );
        }
      }
      return [];
    }
    
    // Handle different mapping structures
    if (mapping.languages && typeof mapping.languages === 'object') {
      // Type 1: Has nested languages object (Full-Stack, Frontend, Mobile, etc.)
      return Object.keys(mapping.languages);
    } else {
      // Type 2: Direct language keys (Backend Development)
      return Object.keys(mapping).filter(key => key !== 'tools');
    }
  };

  const getRelevantFrameworks = () => {
    if (!formData.preferred_tech_stack) return [];
    const mapping = TECH_STACK_MAPPINGS[formData.preferred_tech_stack as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping) return [];
    
    // Special handling for "I am new to programming"
    if (formData.preferred_tech_stack === 'I am new to programming') {
      // If a path is selected, return frameworks from that path
      if (selectedRecommendedPath && mapping.recommendedPaths?.[selectedRecommendedPath]) {
        const pathData = mapping.recommendedPaths[selectedRecommendedPath];
        if (pathData.steps && Array.isArray(pathData.steps)) {
          return pathData.steps.filter((item: string) => 
            ['React', 'Flask', 'Express', 'Unity', 'Flutter'].includes(item)
          );
        }
      }
      return [];
    }
    
    // Special handling for Full-Stack with dual language selection
    if (isFullStack && (backendLanguage || frontendLanguage)) {
      const frameworks: string[] = [];
      
      // Add frameworks from backend language
      if (backendLanguage && mapping.languages?.[backendLanguage]?.frameworks) {
        frameworks.push(...mapping.languages[backendLanguage].frameworks);
      }
      
      // Add frameworks from frontend language
      if (frontendLanguage && mapping.languages?.[frontendLanguage]?.frameworks) {
        frameworks.push(...mapping.languages[frontendLanguage].frameworks);
      }
      
      return [...new Set(frameworks)]; // Remove duplicates
    }
    
    // If a specific language is selected, show only its frameworks
    if (formData.programming_languages.length > 0) {
      const selectedLanguage = formData.programming_languages[0]; // Since we only allow one language for non-Full-Stack
      
      if (mapping.languages && typeof mapping.languages === 'object') {
        // Type 1: Has nested languages object
        const langData = mapping.languages[selectedLanguage];
        if (langData && langData.frameworks && Array.isArray(langData.frameworks)) {
          return langData.frameworks;
        }
      } else {
        // Type 2: Direct language keys (Backend Development)
        const langData = mapping[selectedLanguage];
        if (langData && langData.frameworks && Array.isArray(langData.frameworks)) {
          return langData.frameworks;
        }
      }
    }
    
    return []; // No frameworks until language is selected
  };

  const getRelevantTools = () => {
    if (!formData.preferred_tech_stack) return [];
    const mapping = TECH_STACK_MAPPINGS[formData.preferred_tech_stack as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping) return [];
    
    const tools: string[] = [];
    
    // Special handling for "I am new to programming"
    if (formData.preferred_tech_stack === 'I am new to programming') {
      // If a path is selected, return tools from that path and essential tools
      if (selectedRecommendedPath && mapping.recommendedPaths?.[selectedRecommendedPath]) {
        const pathData = mapping.recommendedPaths[selectedRecommendedPath];
        if (pathData.steps && Array.isArray(pathData.steps)) {
          const pathTools = pathData.steps.filter((item: string) => 
            ['VS Code', 'PostgreSQL', 'GitHub', 'APIs', 'Widgets', 'Firebase', 'Chrome DevTools', 'Postman', 'Terminal', 'Git'].includes(item)
          );
          tools.push(...pathTools);
        }
      }
      
      // Add essential tools from the "tools" path
      if (mapping.recommendedPaths?.tools?.steps) {
        tools.push(...mapping.recommendedPaths.tools.steps);
      }
      
      return [...new Set(tools)];
    }
    
    // Special handling for Full-Stack with dual language selection
    if (isFullStack && (backendLanguage || frontendLanguage)) {
      // Add tools from backend language
      if (backendLanguage && mapping.languages?.[backendLanguage]?.tools) {
        tools.push(...mapping.languages[backendLanguage].tools);
      }
      
      // Add tools from frontend language
      if (frontendLanguage && mapping.languages?.[frontendLanguage]?.tools) {
        tools.push(...mapping.languages[frontendLanguage].tools);
      }
      
      // Add common tools
      if (mapping.commonTools && Array.isArray(mapping.commonTools)) {
        tools.push(...mapping.commonTools);
      }
      
      return [...new Set(tools)]; // Remove duplicates
    }
    
    // If a specific language is selected, show only its tools + common tools
    if (formData.programming_languages.length > 0) {
      const selectedLanguage = formData.programming_languages[0]; // Since we only allow one language for non-Full-Stack
      
      if (mapping.languages && typeof mapping.languages === 'object') {
        // Type 1: Has nested languages object
        const langData = mapping.languages[selectedLanguage];
        if (langData && langData.tools && Array.isArray(langData.tools)) {
          tools.push(...langData.tools);
        }
        
        // Add common tools
        if (mapping.commonTools && Array.isArray(mapping.commonTools)) {
          tools.push(...mapping.commonTools);
        }
      } else {
        // Type 2: Direct language keys (Backend Development)
        const langData = mapping[selectedLanguage];
        if (langData && langData.tools && Array.isArray(langData.tools)) {
          tools.push(...langData.tools);
        }
        
        // Add common tools array
        if (mapping.tools && Array.isArray(mapping.tools)) {
          tools.push(...mapping.tools);
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(tools)];
  };



  // Load saved data from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const savedData = loadOnboardingFromStorage();
    if (savedData) {
      setFormData(savedData.formData);
      setCurrentStep(savedData.currentStep);
      setCurrentSubStep(savedData.currentSubStep);
      setSelectedRecommendedPath(savedData.selectedRecommendedPath);
      setOtherMajor(savedData.otherMajor);
      
      // Restore Full-Stack specific state
      if (savedData.backendLanguage) setBackendLanguage(savedData.backendLanguage);
      if (savedData.frontendLanguage) setFrontendLanguage(savedData.frontendLanguage);
      if (savedData.backendFramework) setBackendFramework(savedData.backendFramework);
      if (savedData.frontendFramework) setFrontendFramework(savedData.frontendFramework);
      
      // Initialize otherMajor state if major contains "Other - " format
      if (savedData.formData.major.startsWith('Other - ')) {
        setOtherMajor(savedData.formData.major.substring(8));
      }
    }
  }, [isAuthenticated]);

  // Restore Full-Stack language selections when returning to Full-Stack
  useEffect(() => {
    if (isFullStack && formData.programming_languages.length === 2) {
      const [lang1, lang2] = formData.programming_languages;
      const backendLangs = getBackendLanguages();
      const frontendLangs = getFrontendLanguages();
      
      // Determine which language is backend and which is frontend
      if (backendLangs.includes(lang1) && frontendLangs.includes(lang2)) {
        setBackendLanguage(lang1);
        setFrontendLanguage(lang2);
      } else if (backendLangs.includes(lang2) && frontendLangs.includes(lang1)) {
        setBackendLanguage(lang2);
        setFrontendLanguage(lang1);
      }
    }
  }, [isFullStack, formData.programming_languages]);

  // Load onboarding options on mount
  useEffect(() => {
    const loadOptions = async () => {
      const optionsData = await getOnboardingOptions();
      if (optionsData) {
        setOptions(optionsData);
      }
    };
    loadOptions();
    
    // Initialize otherMajor state if major contains "Other - " format
    if (formData.major.startsWith('Other - ')) {
      setOtherMajor(formData.major.substring(8));
    }
  }, [getOnboardingOptions]);

  // Scroll to top on step change
  useEffect(() => {
    topOfPageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep, currentSubStep]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleMajorChange = (value: string) => {
    if (value === 'Other') {
      setOtherMajor('');
      updateFormData('major', 'Other');
    } else {
      setOtherMajor('');
      updateFormData('major', value);
    }
  };

  const handleOtherMajorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherMajor(value);
    // Store in format "Other - <user_input>" or just "Other" if empty
    updateFormData('major', value ? `Other - ${value}` : 'Other');
    
    // Save otherMajor to localStorage
    saveCurrentState({
      formData: {
        ...formData,
        major: value ? `Other - ${value}` : 'Other'
      },
      otherMajor: value
    });
  };

  // Helper function to get display value for major select
  const getMajorDisplayValue = () => {
    if (!formData.major) return '';
    if (formData.major.startsWith('Other - ')) return 'Other';
    return formData.major;
  };

  // Helper function to check if Other input should be shown
  const shouldShowOtherMajorInput = () => {
    return getMajorDisplayValue() === 'Other';
  };

  // Helper function to get other major input value
  const getOtherMajorValue = () => {
    if (formData.major.startsWith('Other - ')) {
      return formData.major.substring(8); // Remove "Other - " prefix
    }
    return otherMajor;
  };

  // Helper function to save current state to localStorage
  const saveCurrentState = (overrides?: Partial<StoredOnboardingData>) => {
    if (isAuthenticated) {
      saveOnboardingToStorage({
        formData,
        currentStep,
        currentSubStep,
        selectedRecommendedPath,
        otherMajor,
        backendLanguage,
        frontendLanguage,
        backendFramework,
        frontendFramework,
        ...overrides
      });
    }
  };

  const updateFormData = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => {
      const newFormData = {
      ...prev,
      [field]: value
      };
      
      // Save to localStorage with the new form data
      if (isAuthenticated) {
        saveOnboardingToStorage({
          formData: newFormData,
          currentStep,
          currentSubStep,
          selectedRecommendedPath,
          otherMajor,
          backendLanguage,
          frontendLanguage,
          backendFramework,
          frontendFramework
        });
      }
      
      return newFormData;
    });
  };

  // Full-Stack language selection handlers
  const handleBackendLanguageChange = (language: string) => {
    setBackendLanguage(language);
    updateFullStackLanguages(language, frontendLanguage);
    // Save to localStorage
    saveCurrentState({
      backendLanguage: language
    });
  };

  const handleFrontendLanguageChange = (language: string) => {
    setFrontendLanguage(language);
    updateFullStackLanguages(backendLanguage, language);
    // Save to localStorage
    saveCurrentState({
      frontendLanguage: language
    });
  };

  // Full-Stack framework selection handlers
  const handleBackendFrameworkChange = (framework: string) => {
    setBackendFramework(framework);
    updateFullStackFrameworks(framework, frontendFramework);
    // Save to localStorage
    saveCurrentState({
      backendFramework: framework
    });
  };

  const handleFrontendFrameworkChange = (framework: string) => {
    setFrontendFramework(framework);
    updateFullStackFrameworks(backendFramework, framework);
    // Save to localStorage
    saveCurrentState({
      frontendFramework: framework
    });
  };

  const updateFullStackLanguages = (backend: string, frontend: string) => {
    const languages = [backend, frontend].filter(Boolean);
    updateFormData('programming_languages', languages);
    
    // Clear frameworks and tools when languages change
    updateFormData('frameworks', []);
    updateFormData('tools', []);
  };

  const updateFullStackFrameworks = (backend: string, frontend: string) => {
    const frameworks = [backend, frontend].filter(Boolean);
    updateFormData('frameworks', frameworks);
    
    // Clear tools when frameworks change
    updateFormData('tools', []);
  };

  const handleRecommendedPathSelection = (path: string) => {
    setSelectedRecommendedPath(path);
    
    // Auto-populate based on selected path
    const mapping = TECH_STACK_MAPPINGS['I am new to programming'] as any;
    if (mapping?.recommendedPaths?.[path]) {
      const pathData = mapping.recommendedPaths[path];
      
      // Set languages, frameworks, and tools based on the path steps and tools
      if (pathData.steps && Array.isArray(pathData.steps)) {
        // Categorize the steps into languages, frameworks, and concepts
        const languages = pathData.steps.filter((item: string) => 
          ['HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'Dart'].includes(item)
        );
        const frameworks = pathData.steps.filter((item: string) => 
          ['React', 'Flask', 'Express', 'Unity', 'Flutter'].includes(item)
        );
        
        // Use the new tools field from the path data
        const pathTools = pathData.tools || [];
        const concepts = pathData.steps.filter((item: string) => 
          !languages.includes(item) && !frameworks.includes(item)
        );
        
        updateFormData('programming_languages', languages);
        updateFormData('frameworks', frameworks);
        updateFormData('tools', [...pathTools, ...concepts]);
      }
    }
    
    // Save selectedRecommendedPath to localStorage
    saveCurrentState({
      selectedRecommendedPath: path
    });
    
    // Don't auto-advance - let user see what was selected
  };

  const toggleArrayItem = (field: keyof OnboardingFormData, item: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    updateFormData(field, newArray);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.current_year && formData.major);
      case 2:
        // For beginners, frameworks can be empty if auto-populated path has none
        const frameworksValid = isNewToProgramming ? 
          formData.frameworks.length >= 0 : // Beginners can have 0 or more frameworks
          isFullStack ? 
            formData.frameworks.length >= 0 : // Full-Stack can have 0-2 frameworks (handled by sub-step validation)
            formData.frameworks.length === 1; // Non-beginners need exactly 1
        const languagesValid = isNewToProgramming ? 
          formData.programming_languages.length >= 0 : // Beginners can have 0 or more languages
          isFullStack ?
            formData.programming_languages.length >= 0 : // Full-Stack can have 0-2 languages (handled by sub-step validation)
            formData.programming_languages.length === 1; // Non-beginners need exactly 1
        
        return !!(formData.preferred_tech_stack && languagesValid && frameworksValid && formData.tools.length > 0 && formData.experience_level && formData.skill_confidence);
      case 3:
        return true; // Optional fields
      case 4:
        return !!(formData.target_roles.length > 0);
      case 5:
        return !!(formData.application_timeline);
      default:
        return true;
    }
  };

  const validateSubStep = (subStep: number): boolean => {
    if (isNewToProgramming) {
      switch (subStep) {
        case 1: // Tech Stack
          return !!(formData.preferred_tech_stack);
        case 2: // Learning Path
          return !!(selectedRecommendedPath);
        case 3: // Experience
          return !!(formData.experience_level && formData.skill_confidence);
        default:
          return true;
      }
    } else {
    switch (subStep) {
      case 1: // Tech Stack
        return !!(formData.preferred_tech_stack);
      case 2: // Languages
          if (isFullStack) {
            // For Full-Stack, require both backend and frontend languages
            return !!(backendLanguage && frontendLanguage);
          } else {
            // For other stacks, require exactly one language
            return formData.programming_languages.length === 1;
          }
      case 3: // Frameworks
          if (isFullStack) {
            // For Full-Stack, require both backend and frontend frameworks (if available)
            const backendFrameworks = getBackendFrameworks();
            const frontendFrameworks = getFrontendFrameworks();
            const backendValid = backendFrameworks.length === 0 || !!backendFramework;
            const frontendValid = frontendFrameworks.length === 0 || !!frontendFramework;
            return backendValid && frontendValid;
          } else {
            // For other stacks, require exactly one framework or allow no frameworks if none available
            return formData.frameworks.length === 1 || getRelevantFrameworks().length === 0;
          }
      case 4: // Tools
          return formData.tools.length > 0;
      case 5: // Experience
        return !!(formData.experience_level && formData.skill_confidence);
      default:
        return true;
      }
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      const newStep = currentStep + 1;
      const newSubStep = 1;
      setStepDirection('forward');
      setCurrentStep(newStep);
      setCurrentSubStep(newSubStep); // Reset sub-step when moving to next main step
      
      // Save to localStorage
      saveCurrentState({
        currentStep: newStep,
        currentSubStep: newSubStep
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      const newSubStep = currentStep === 2 ? totalSubSteps : 1;
      setStepDirection('backward');
      setCurrentStep(newStep);
      setCurrentSubStep(newSubStep); // If going back to step 2, go to last sub-step
      
      // Save to localStorage
      saveCurrentState({
        currentStep: newStep,
        currentSubStep: newSubStep
      });
    }
  };

  const nextSubStep = () => {
    if (validateSubStep(currentSubStep) && currentSubStep < totalSubSteps) {
      const newSubStep = currentSubStep + 1;
      setCurrentSubStep(newSubStep);
      
      // Save to localStorage
      saveCurrentState({
        currentSubStep: newSubStep
      });
    }
  };

  const prevSubStep = () => {
    if (currentSubStep > 1) {
      const newSubStep = currentSubStep - 1;
      setCurrentSubStep(newSubStep);
      
      // Save to localStorage
      saveCurrentState({
        currentSubStep: newSubStep
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Transform form data to API format with default values for AI
    const onboardingData = {
      current_year: formData.current_year,
      major: formData.major,
      programming_languages: formData.programming_languages,
      frameworks: formData.frameworks,
      tools: formData.tools,
      preferred_tech_stack: formData.preferred_tech_stack,
      experience_level: formData.experience_level,
      skill_confidence: formData.skill_confidence,
      has_internship_experience: formData.has_internship_experience,
      previous_internships: formData.previous_internships.trim() || undefined,
      projects: formData.projects.trim() || undefined,
      target_roles: formData.target_roles,
      preferred_company_types: formData.preferred_company_types,
      preferred_locations: formData.preferred_locations,
      application_timeline: formData.application_timeline,
      additional_info: formData.additional_info.trim() || undefined,
      source_of_discovery: formData.source_of_discovery.trim() || undefined
    };

    const success = await createOnboarding(onboardingData);
    if (success) {
      // Clear the saved draft from localStorage since onboarding is complete
      clearOnboardingFromStorage();
      
      // Redirect to dashboard/main app
      navigate('/my-roadmap');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 sm:mb-12 px-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`
            relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-500 ease-out transform
            ${i + 1 <= currentStep 
              ? 'bg-purple-500 border-purple-500 text-white shadow-lg scale-110' 
              : 'bg-theme-secondary border-purple-300 dark:border-purple-600 text-theme-primary hover:border-purple-500 hover:scale-105'
            }
          `}>
            {i + 1 < currentStep ? (
              <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 animate-in zoom-in-50 duration-300" />
            ) : (
              <span className="text-xs sm:text-sm font-semibold">{i + 1}</span>
            )}
            {i + 1 === currentStep && (
              <div className="absolute inset-0 rounded-full bg-purple-500 opacity-20 animate-ping"></div>
            )}
          </div>
          {i < totalSteps - 1 && (
            <div className={`
              w-8 sm:w-12 md:w-16 h-1 mx-1 sm:mx-2 md:mx-3 rounded-full transition-all duration-500 ease-out
              ${i + 1 < currentStep 
                ? 'bg-purple-500 shadow-sm' 
                : 'bg-theme-hover'
              }
            `}>
              {i + 1 < currentStep && (
                <div className="h-full bg-purple-500 rounded-full animate-in slide-in-from-left duration-500"></div>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className={`space-y-6 sm:space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="relative inline-block">
          <User className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 text-purple-500 mx-auto mb-4 sm:mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2 sm:mb-3 animate-in slide-in-from-bottom duration-500 delay-200 px-2">Academic Background</h2>
        <p className="text-base sm:text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300 px-4">Tell us about your current academic status</p>
      </div>

      <div className="space-y-6">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Current Academic Year <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.current_year}
            onChange={(value) => updateFormData('current_year', value)}
            placeholder="Select your current academic year"
            options={options?.current_year_options.map(option => ({ value: option, label: option })) || []}
          />
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-500">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Field of Study <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={getMajorDisplayValue()}
            onChange={handleMajorChange}
            placeholder="Select your field of study"
            options={['Computer Science', 'Software Engineering', 'Data Science', 'Information Technology', 'Electrical and Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Economics', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Psychology', 'Other'].map(option => ({ value: option, label: option }))}
          />
          {shouldShowOtherMajorInput() && (
            <input
              type="text"
              value={getOtherMajorValue()}
              onChange={handleOtherMajorChange}
              placeholder="Please specify your field of study"
              className="mt-3 w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary"
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={`space-y-6 sm:space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="relative inline-block">
          <Code className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 text-purple-500 mx-auto mb-4 sm:mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2 sm:mb-3 animate-in slide-in-from-bottom duration-500 delay-200 px-2">Technical Background</h2>
      </div>

      <div className="space-y-8">
        {/* Step 2.1: Tech Stack Selection */}
        {currentSubStep === 1 && (
          <div className="animate-in slide-in-from-right duration-500 ease-out">
            <div className="w-full border-t border-theme mb-8" />
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-theme-primary mb-2">Choose Your Tech Stack</h3>
            </div>
            
            <div className="flex justify-center">
              <div className={`grid gap-4 w-full ${
                Object.keys(TECH_STACK_MAPPINGS).length <= 6 
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
              }`}>
              {Object.keys(TECH_STACK_MAPPINGS).map((stack) => (
                <CustomSelector
                  key={stack}
                  type="radio"
                  id={`stack-${stack}`}
                  name="preferred_tech_stack"
                  label={stack}
                  checked={formData.preferred_tech_stack === stack}
                  onChange={() => {
                    // Clear all selections when changing tech stack
                    updateFormData('preferred_tech_stack', stack);
                    updateFormData('programming_languages', []);
                    updateFormData('frameworks', []);
                    updateFormData('tools', []);
                    setSelectedRecommendedPath('');
                    
                    // Clear Full-Stack language selections
                    setBackendLanguage('');
                    setFrontendLanguage('');
                    
                    // Clear Full-Stack framework selections
                    setBackendFramework('');
                    setFrontendFramework('');
                  }}
                  dimmed={formData.preferred_tech_stack !== '' && formData.preferred_tech_stack !== stack}
                  tooltip={stack === 'I am new to programming' ? 'Perfect for beginners! We\'ll guide you through the basics.' : undefined}
                />
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2.2: Learning Path Selection (for beginners only) */}
        {currentSubStep === 2 && isNewToProgramming && (
          <div className="animate-in slide-in-from-right duration-500 ease-out">
            <div className="w-full border-t border-theme mb-8" />
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-theme-primary mb-4">Choose Your Learning Path</h3>
              <p className="text-theme-secondary">
                We've prepared some recommended learning paths to help you get started.
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className={`grid gap-4 w-full ${
                Object.keys((TECH_STACK_MAPPINGS['I am new to programming'] as any)?.recommendedPaths || {}).length <= 2 
                  ? 'grid-cols-1 max-w-2xl' 
                  : Object.keys((TECH_STACK_MAPPINGS['I am new to programming'] as any)?.recommendedPaths || {}).length <= 4
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
              }`}>
              {Object.entries((TECH_STACK_MAPPINGS['I am new to programming'] as any)?.recommendedPaths || {}).map(([pathKey, pathData]: [string, any]) => {
                return (
                  <div
                    key={pathKey}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedRecommendedPath === pathKey
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                    onClick={() => handleRecommendedPathSelection(pathKey)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all duration-200 ${
                        selectedRecommendedPath === pathKey
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-purple-300 dark:border-purple-600'
                      }`}>
                        {selectedRecommendedPath === pathKey && <Check className="w-3 h-3 text-white m-0.5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-theme-primary capitalize mb-2">
                          {pathKey === 'gameDev' ? 'Game Development' : pathKey.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <div className="space-y-2">
                          {/* Technologies */}
                          <div className="flex flex-wrap gap-1">
                            {pathData.steps?.slice(0, 3).map((tech: string) => (
                              <span
                                key={tech}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded-md font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                            {pathData.steps?.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                +{pathData.steps.length - 3} more
                              </span>
                            )}
                          </div>
                          {/* Tools */}
                          {pathData.tools && pathData.tools.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {pathData.tools.slice(0, 3).map((tool: string) => (
                                <span
                                  key={tool}
                                  className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-xs rounded-md font-medium"
                                >
                                  {tool}
                                </span>
                              ))}
                              {pathData.tools.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                                  +{pathData.tools.length - 3} tools
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-theme-secondary">
                          {pathData.explanation || 'Learn the fundamentals of programming'}
                        </p>
                      </div>
                    </div>
                  </div>
                                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2.2: Programming Languages (non-beginners only) */}
        {currentSubStep === 2 && !isNewToProgramming && (
          <div className="animate-in slide-in-from-right duration-500 ease-out">
            <div className="w-full border-t border-theme mb-8" />
            
            {isFullStack ? (
              // Full-Stack dual language selection
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-theme-primary mb-4">Choose your Full-Stack languages</h3>
                  <p className="text-theme-secondary">
                    Select one backend language and one frontend language for your Full-Stack development
                  </p>
                </div>
                
                <div className="space-y-8">
                  {/* Backend Language Selection */}
                  <div>
                    <h4 className="text-lg font-semibold text-theme-primary mb-4 text-center">
                      Backend Language <span className="text-red-500">*</span>
                    </h4>
                    <div className="flex justify-center">
                      <div className={`grid gap-3 w-full ${
                        getBackendLanguages().length === 1 ? 'grid-cols-1 max-w-md' :
                        getBackendLanguages().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                        getBackendLanguages().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl' :
                        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      }`}>
                        {getBackendLanguages().map((language: string) => (
                          <CustomSelector
                            key={`backend-${language}`}
                            type="radio"
                            id={`backend-lang-${language}`}
                            name="backend_language"
                            label={language}
                            checked={backendLanguage === language}
                            onChange={() => handleBackendLanguageChange(language)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Frontend Language Selection */}
                  <div>
                    <h4 className="text-lg font-semibold text-theme-primary mb-4 text-center">
                      Frontend Language <span className="text-red-500">*</span>
                    </h4>
                    <div className="flex justify-center">
                      <div className={`grid gap-3 w-full ${
                        getFrontendLanguages().length === 1 ? 'grid-cols-1 max-w-md' :
                        getFrontendLanguages().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                        getFrontendLanguages().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl' :
                        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      }`}>
                        {getFrontendLanguages().map((language: string) => (
                          <CustomSelector
                            key={`frontend-${language}`}
                            type="radio"
                            id={`frontend-lang-${language}`}
                            name="frontend_language"
                            label={language}
                            checked={frontendLanguage === language}
                            onChange={() => handleFrontendLanguageChange(language)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Single language selection for non-Full-Stack
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-theme-primary mb-4">Choose your primary programming language</h3>
                  <p className="text-theme-secondary">
                    {formData.preferred_tech_stack && (
                      <span className="block mt-2 mb-1 text-purple-600 dark:text-purple-400 font-medium">
                        ✨ Languages available for {formData.preferred_tech_stack}
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className={`grid gap-3 w-full ${
                    getRelevantLanguages().length === 1 ? 'grid-cols-1 max-w-md' :
                    getRelevantLanguages().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                    getRelevantLanguages().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl' :
                    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  }`}>
                    {getRelevantLanguages().map((language: string) => (
                      <CustomSelector
                        key={language}
                        type="radio"
                        id={`lang-${language}`}
                        name="selected_language"
                        label={language}
                        checked={formData.programming_languages.includes(language)}
                        onChange={() => {
                          // Single language selection - replace the array with just this language
                          updateFormData('programming_languages', [language]);
                          // Clear frameworks and tools when language changes
                          updateFormData('frameworks', []);
                          updateFormData('tools', []);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2.3: Frameworks (non-beginners only) */}
        {currentSubStep === 3 && !isNewToProgramming && (
          <div className="animate-in slide-in-from-right duration-500 ease-out">
            <div className="w-full border-t border-theme mb-8" />
            
            {isFullStack ? (
              // Full-Stack dual framework selection
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-theme-primary mb-4">Choose your Full-Stack frameworks</h3>
                  <p className="text-theme-secondary">
                    Select frameworks for your backend and frontend languages
                  </p>
                </div>
                
                <div className="space-y-8">
                  {/* Backend Framework Selection */}
                  {getBackendFrameworks().length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-theme-primary mb-4 text-center">
                        Backend Framework for {backendLanguage} <span className="text-red-500">*</span>
                      </h4>
                      <div className="flex justify-center">
                        <div className={`grid gap-3 w-full ${
                          getBackendFrameworks().length === 1 ? 'grid-cols-1 max-w-md' :
                          getBackendFrameworks().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                          getBackendFrameworks().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl' :
                          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                        }`}>
                          {getBackendFrameworks().map((framework: string) => (
                            <CustomSelector
                              key={`backend-${framework}`}
                              type="radio"
                              id={`backend-framework-${framework}`}
                              name="backend_framework"
                              label={framework}
                              checked={backendFramework === framework}
                              onChange={() => handleBackendFrameworkChange(framework)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Frontend Framework Selection */}
                  {getFrontendFrameworks().length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-theme-primary mb-4 text-center">
                        Frontend Framework for {frontendLanguage} <span className="text-red-500">*</span>
                      </h4>
                      <div className="flex justify-center">
                        <div className={`grid gap-3 w-full ${
                          getFrontendFrameworks().length === 1 ? 'grid-cols-1 max-w-md' :
                          getFrontendFrameworks().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                          getFrontendFrameworks().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl' :
                          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                        }`}>
                          {getFrontendFrameworks().map((framework: string) => (
                            <CustomSelector
                              key={`frontend-${framework}`}
                              type="radio"
                              id={`frontend-framework-${framework}`}
                              name="frontend_framework"
                              label={framework}
                              checked={frontendFramework === framework}
                              onChange={() => handleFrontendFrameworkChange(framework)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* No frameworks available message */}
                  {getBackendFrameworks().length === 0 && getFrontendFrameworks().length === 0 && (
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-theme-primary mb-4">Framework Selection</h3>
                      </div>
                      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-lg">No Heavy Frameworks Needed</h4>
                            <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-3">
                              Your selected languages ({backendLanguage} and {frontendLanguage}) focus on core libraries and built-in capabilities.
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              You'll work directly with powerful built-in libraries rather than heavy frameworks. This approach gives you more control and better performance.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Single framework selection for non-Full-Stack
              getRelevantFrameworks().length > 0 ? (
                <>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-theme-primary mb-4">Choose your main framework <span className="text-red-500">*</span></h3>
                    <p className="text-theme-secondary">
                      <span className="block mt-2 mb-1 text-purple-600 dark:text-purple-400 font-medium">
                        ✨ Frameworks available for {formData.programming_languages[0]}
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className={`grid gap-3 w-full ${
                      getRelevantFrameworks().length === 1 ? 'grid-cols-1 max-w-md' :
                      getRelevantFrameworks().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
                      getRelevantFrameworks().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-5xl' :
                      'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    }`}>
                      {getRelevantFrameworks().map((framework: string) => (
                        <CustomSelector
                          key={framework}
                          type="radio"
                          id={`framework-${framework}`}
                          name="selected_framework"
                          label={framework}
                          checked={formData.frameworks.includes(framework)}
                          onChange={() => {
                            // Single framework selection - replace the array with just this framework
                            updateFormData('frameworks', [framework]);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-theme-primary mb-4">Framework Selection</h3>
                  </div>
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-lg">No Heavy Frameworks Needed</h4>
                        <p className="text-blue-800 dark:text-blue-200 leading-relaxed mb-3">
                          {formData.programming_languages[0]} in {formData.preferred_tech_stack} focuses on core libraries, command-line tools, and system-level programming.
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">
                          You'll work directly with powerful built-in libraries and specialized security tools rather than web frameworks. This approach gives you more control and better performance for {formData.preferred_tech_stack.toLowerCase()} tasks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Step 2.4: Tools (non-beginners only) */}
        {currentSubStep === 4 && !isNewToProgramming && (
          <div className="animate-in slide-in-from-right duration-500 ease-out">
            <div className="w-full border-t border-theme mb-8" />
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-theme-primary mb-4">Select tools and technologies you want to use <span className="text-red-500">*</span></h3>
              <p className="text-theme-secondary">
                {formData.programming_languages.length > 0 ? (
                  <span className="block mt-2 mb-1 text-purple-600 dark:text-purple-400 font-medium">
                    ✨ Tools relevant for {formData.programming_languages[0]} + essential ones
                  </span>
                ) : (
                  <span className="text-theme-secondary">Please select a language first to see relevant tools.</span>
                )}
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className={`grid gap-3 w-full ${
                getRelevantTools().length <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl' :
                getRelevantTools().length <= 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 max-w-6xl' :
                getRelevantTools().length <= 10 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 max-w-7xl' :
                'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {getRelevantTools().map((tool) => (
                   <CustomSelector
                     key={tool}
                     type="checkbox"
                     id={`tool-${tool}`}
                     label={tool}
                     checked={formData.tools.includes(tool)}
                     onChange={() => toggleArrayItem('tools', tool)}
                   />
                ))}
              </div>
             </div>
          </div>
        )}

        {/* Step 2.3: Experience Level for beginners, Step 2.5 for non-beginners */}
        {((currentSubStep === 3 && isNewToProgramming) || (currentSubStep === 5 && !isNewToProgramming)) && (
          <div className="animate-in slide-in-from-right duration-500 ease-out">
            <div className="w-full border-t border-theme mb-8" />
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-theme-primary mb-2">Help us understand your current skill level</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3">
                  Overall Experience Level <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.experience_level}
                  onChange={(value) => updateFormData('experience_level', value)}
                  placeholder="Select your experience level"
                  options={options?.experience_level_options.map(option => ({ value: option, label: option })) || []}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-theme-primary mb-3">
                  Skill Confidence <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={formData.skill_confidence}
                  onChange={(value) => updateFormData('skill_confidence', value)}
                  placeholder="How confident do you feel about your technical skills?"
                  options={options?.skill_confidence_options.map(option => ({ value: option, label: option })) || []}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sub-step navigation */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 mt-6 pt-4 border-t border-theme">
          <div className="flex items-center justify-between w-full">
            {!(currentStep === 2 && currentSubStep === 1) ? (
              <button
                onClick={prevSubStep}
                disabled={currentSubStep === 1}
                className="flex items-center space-x-2 px-4 py-2 text-theme-secondary font-medium rounded-lg border-2 border-theme hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="hidden sm:inline">
                  {currentSubStep > 1 ? subStepNames[currentSubStep - 2] : ''}
                </span>
                <span className="sm:hidden">Back</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg transition-colors duration-300">
              <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
              <span className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-300">
                <span className="hidden sm:inline">{currentSubStep} of {totalSubSteps}: {subStepNames[currentSubStep - 1]}</span>
                <span className="sm:hidden">{currentSubStep}/{totalSubSteps}</span>
              </span>
            </div>

            {!(currentStep === 2 && (currentSubStep === totalSubSteps || !validateSubStep(currentSubStep))) ? (
              <button
                onClick={nextSubStep}
                disabled={currentSubStep === totalSubSteps || !validateSubStep(currentSubStep)}
                className="flex items-center space-x-2 px-4 py-2 text-theme-secondary font-medium rounded-lg border-2 border-theme hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
              >
                <span className="hidden sm:inline">
                  {currentSubStep < totalSubSteps ? subStepNames[currentSubStep] : 'Complete'}
                </span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={`space-y-6 sm:space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="relative inline-block">
          <Briefcase className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 text-purple-500 mx-auto mb-4 sm:mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2 sm:mb-3 animate-in slide-in-from-bottom duration-500 delay-200 px-2">Experience</h2>
        <p className="text-base sm:text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300 px-4">Tell us about your internship and project experience</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Do you have previous internship experience?
          </label>
          <div className="flex space-x-6">
            <CustomSelector
              type="radio"
              id="exp-yes"
              name="internship_experience"
              label="Yes"
              checked={formData.has_internship_experience === true}
              onChange={() => updateFormData('has_internship_experience', true)}
            />
            <CustomSelector
              type="radio"
              id="exp-no"
              name="internship_experience"
              label="No"
              checked={formData.has_internship_experience === false}
              onChange={() => updateFormData('has_internship_experience', false)}
            />
          </div>
        </div>

        {formData.has_internship_experience && (
          <div className="animate-in slide-in-from-bottom duration-500 delay-500">
            <label className="block text-sm font-semibold text-theme-primary mb-3">
              Previous Internships
            </label>
            <TextAreaWithCounter
              value={formData.previous_internships}
              onChange={(e) => updateFormData('previous_internships', e.target.value)}
              placeholder="Tell us about your previous internship experiences..."
              maxLength={300}
            />
          </div>
        )}

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Projects
          </label>
          <TextAreaWithCounter
            value={formData.projects}
            onChange={(e) => updateFormData('projects', e.target.value)}
            placeholder="Describe any personal projects, hackathons, or coursework projects..."
            maxLength={300}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className={`space-y-6 sm:space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="relative inline-block">
          <Target className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 text-purple-500 mx-auto mb-4 sm:mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2 sm:mb-3 animate-in slide-in-from-bottom duration-500 delay-200 px-2">Career Goals</h2>
        <p className="text-base sm:text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300 px-4">Help us understand your career aspirations</p>
      </div>

      
      <div className="animate-in slide-in-from-bottom duration-500 delay-600">
        <label className="block text-sm font-semibold text-theme-primary mb-4">
          Preferred MANGO Company <span className="text-theme-secondary font-normal">(Select all that apply)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options?.company_type_options.map((type, index) => (
            <CustomSelector
              key={type}
              type="checkbox"
              id={`company-${type}`}
              label={type}
              checked={formData.preferred_company_types.includes(type)}
              onChange={() => toggleArrayItem('preferred_company_types', type)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Target Roles <span className="text-red-500">*</span> <span className="text-theme-secondary font-normal">(Select all that apply)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options?.target_role_options.map((role, index) => (
              <CustomSelector
                key={role}
                type="checkbox"
                id={`role-${role}`}
                label={role}
                checked={formData.target_roles.includes(role)}
                onChange={() => toggleArrayItem('target_roles', role)}
              />
            ))}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-800">
          <label className="block text-sm font-semibold text-theme-primary mb-4">
            Preferred Locations <span className="text-theme-secondary font-normal">(Optional)</span>
          </label>
          <LocationAutocomplete
            selectedLocations={formData.preferred_locations}
            onChange={(locations) => updateFormData('preferred_locations', locations)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className={`space-y-6 sm:space-y-8 animate-in ${stepDirection === 'forward' ? 'slide-in-from-right' : 'slide-in-from-left'} duration-500 ease-out`}>
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="relative inline-block">
          <Rocket className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 text-purple-500 mx-auto mb-4 sm:mb-6 animate-in zoom-in duration-700 delay-100" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-2 sm:mb-3 animate-in slide-in-from-bottom duration-500 delay-200 px-2">Final Touches</h2>
        <p className="text-base sm:text-lg text-theme-secondary animate-in slide-in-from-bottom duration-500 delay-300 px-4">Just a couple more things to personalize your experience.</p>
      </div>

      <div className="space-y-8">
        <div className="animate-in slide-in-from-bottom duration-500 delay-400">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            How did you hear about us?
          </label>
          <CustomSelect
            value={formData.source_of_discovery}
            onChange={(value) => updateFormData('source_of_discovery', value)}
            placeholder="Select an option"
            options={[
              'Social Media (Twitter, LinkedIn, etc.)',
              'Friend or Colleague',
              'University or College',
              'Online Search (Google, etc.)',
              'Blog or Publication',
              'Other'
            ].map(option => ({ value: option, label: option }))}
          />
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-600">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Application Timeline <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.application_timeline}
            onChange={(value) => updateFormData('application_timeline', value)}
            placeholder="When are you planning to apply?"
            options={options?.timeline_options.map(option => ({ value: option, label: option })) || []}
          />
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-700">
          <label className="block text-sm font-semibold text-theme-primary mb-3">
            Additional Information
          </label>
          <TextAreaWithCounter
            value={formData.additional_info}
            onChange={(e) => updateFormData('additional_info', e.target.value)}
            placeholder="Anything else you'd like us to know for your personalized roadmap?"
            maxLength={300}
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  const canProceedFromStep2 = () => {
    return currentSubStep === totalSubSteps && validateStep(2);
  };

  return (
    <div className="min-h-screen bg-theme-primary py-4 sm:py-8 px-4 transition-colors duration-300" ref={topOfPageRef}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-theme-secondary/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-theme p-4 sm:p-6 md:p-8 lg:p-12 animate-in zoom-in duration-700 transition-colors duration-300">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 animate-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 sm:px-6 py-2 rounded-full text-sm font-semibold mb-4 sm:mb-6 mt-2 sm:mt-4 animate-in zoom-in duration-500 delay-100">
              <Sparkles className="w-4 h-4" />
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-theme-primary mb-4 transition-colors duration-300 px-2">
              Let's get you set up!
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-theme-secondary mb-2 transition-colors duration-300">
              <span>Progress</span>
              <span>{Math.round(((currentStep - 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-theme-hover rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Error Message */}
          {error && (
            <div className="mb-8 animate-in slide-in-from-top duration-300">
              <ErrorMessage error={error} className="rounded-xl" />
            </div>
          )}

          {/* Current Step Content */}
          <div>
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-theme">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 sm:px-6 py-3 text-theme-secondary font-medium rounded-xl hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group order-2 sm:order-1"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="hidden sm:inline">Back to {currentStep === 2 ? 'Academic Background' : currentStep === 3 ? 'Technical Background' : currentStep === 4 ? 'Experience' : currentStep === 5 ? 'Career Goals' : 'Previous'}</span>
              <span className="sm:hidden">Back</span>
            </button>

            {currentStep < totalSteps && (validateStep(currentStep) && (currentStep !== 2 || canProceedFromStep2())) && (
              <button
                onClick={nextStep}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 sm:px-8 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group order-1 sm:order-2"
              >
                <span className="hidden sm:inline">Continue to {currentStep === 1 ? 'Technical Background' : currentStep === 2 ? 'Experience' : currentStep === 3 ? 'Career Goals' : 'Final Steps'}</span>
                <span className="sm:hidden">Continue</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            )}

            {currentStep >= totalSteps && (
              <button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep) || loading}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="hidden sm:inline">Creating Your Roadmap...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Complete Onboarding</span>
                    <span className="sm:hidden">Complete</span>
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;