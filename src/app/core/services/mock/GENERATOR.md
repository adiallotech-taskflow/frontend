# Mock Data Generator

Générateur de données mock réalistes avec support de seed pour des résultats cohérents et reproductibles.

## Fonctionnalités

### 🎯 Données réalistes
- **50 prénoms/noms français** authentiques
- **30 titres de tâches tech** crédibles  
- **20 descriptions de projets** professionnelles
- **Avatars dynamiques** via https://i.pravatar.cc/150?img=[1-70]

### 🔧 Générateurs principaux
- `generateUser()` - Profils utilisateur complets et cohérents
- `generateTask()` - Tâches réalistes selon contexte métier
- `generateWorkspace()` - Espaces de travail avec membres
- `generateActivity()` - Historique d'activité crédible

### 🛠️ Utilitaires
- `randomDate(start, end)` - Dates aléatoires dans une plage
- `randomEnum(enumType)` - Sélection avec poids statistiques  
- `randomSubset(array, count)` - Sous-ensembles aléatoires
- `weightedRandom()` - Distributions réalistes (80% membre, 10% admin, etc.)

### 🎲 Seed reproductible
- Même seed = mêmes données exactes
- Parfait pour tests et démonstrations
- `MockGeneratorUtils.setSeed(42)` pour cohérence

## Utilisation

### Génération simple
```typescript
import { MockDataGenerator } from '@/core/services';

// Utilisateur réaliste
const user = MockDataGenerator.generateUser();
// → { firstName: "Julien", lastName: "Dubois", email: "julien.dubois@techcorp.com", ... }

// Tâche contextuelle  
const task = MockDataGenerator.generateTask({
  assigneeId: user.id,
  workspaceId: "ws-1",
  priority: "high"
});
// → { title: "Implémenter l'authentification JWT", description: "Objectif : ...", ... }
```

### Dataset cohérent
```typescript
// Génération d'un jeu de données complet avec relations
const dataset = MockDataGenerator.generateCohesiveDataset({
  userCount: 15,      // 15 utilisateurs
  workspaceCount: 4,  // 4 espaces de travail  
  taskCount: 30,      // 30 tâches
  seed: 123456        // Seed pour reproductibilité
});

console.log(dataset);
// → { users: [...], workspaces: [...], tasks: [...] }
// Les tâches sont automatiquement assignées aux membres des workspaces
```

### Avec seed fixe
```typescript
// Même résultat à chaque exécution
MockGeneratorUtils.setSeed(42);
const user1 = MockDataGenerator.generateUser();
const user2 = MockDataGenerator.generateUser();

// Reset et même seed = mêmes utilisateurs
MockGeneratorUtils.setSeed(42); 
const user3 = MockDataGenerator.generateUser();
const user4 = MockDataGenerator.generateUser();

// user1 === user3 et user2 === user4 (données identiques)
```

## Intégration avec les services mock

### TaskMockService
```typescript
export class TaskMockService extends MockBaseService<Task> {
  // Données par défaut réalistes
  protected override defaultData: Task[] = this.generateDefaultTasks();

  private generateDefaultTasks(): Task[] {
    return MockDataGenerator.generateCohesiveDataset({
      userCount: 5,
      workspaceCount: 2, 
      taskCount: 12,
      seed: 42 // Seed fixe pour données par défaut cohérentes
    }).tasks;
  }

  // Charge des données de démo riches
  loadRealisticDemoData(): void {
    const demoData = MockDataGenerator.generateCohesiveDataset({
      userCount: 15,
      workspaceCount: 4,
      taskCount: 30,
      seed: 123456
    });
    
    this.loadTestData(demoData.tasks);
  }
}
```

### MockUtilsService
```typescript
export class MockUtilsService {
  seedWithDemoData(): void {
    // Utilise le nouveau générateur pour des données réalistes
    this.taskMockService.loadRealisticDemoData();
  }
}
```

## Exemples de données générées

### Utilisateur
```typescript
{
  id: "user-1k2x3m4n",
  firstName: "Charlotte",
  lastName: "Lambert", 
  email: "charlotte.lambert@innovate.com",
  avatar: "https://i.pravatar.cc/150?img=23",
  role: "member",
  createdAt: "2024-11-15T10:30:00Z",
  updatedAt: "2024-12-01T14:22:00Z"
}
```

### Tâche
```typescript
{
  id: "task-5a9b7c2d",
  title: "Optimiser les requêtes de base de données",
  description: "Optimiser les requêtes de base de données - Cette tâche nécessite une analyse approfondie des besoins et une conception technique détaillée.",
  status: "in-progress",
  priority: "high", 
  assigneeId: "user-1k2x3m4n",
  workspaceId: "ws-3f8h9j1k",
  dueDate: "2024-12-20T23:59:59Z",
  createdAt: "2024-11-20T09:15:00Z",
  updatedAt: "2024-12-02T16:45:00Z"
}
```

### Espace de travail
```typescript
{
  id: "ws-3f8h9j1k",
  name: "Innovation Lab",
  description: "Plateforme de gestion de projets avec collaboration en temps réel",
  ownerId: "user-1k2x3m4n",
  members: [
    {
      userId: "user-1k2x3m4n",
      role: "admin",
      joinedAt: "2024-11-15T10:30:00Z"
    },
    {
      userId: "user-8x7y2z9w", 
      role: "member",
      joinedAt: "2024-11-18T14:20:00Z"
    }
  ],
  createdAt: "2024-11-15T10:30:00Z",
  updatedAt: "2024-12-01T11:15:00Z"
}
```

## Configuration avancée

### Distributions statistiques
```typescript
// 50% low, 35% medium, 15% high (réaliste)
MockDataLists.TASK_PRIORITIES = [
  { item: 'low', weight: 50 },
  { item: 'medium', weight: 35 }, 
  { item: 'high', weight: 15 }
];

// 45% todo, 35% en cours, 20% terminé
MockDataLists.TASK_STATUSES = [
  { item: 'todo', weight: 45 },
  { item: 'in-progress', weight: 35 },
  { item: 'done', weight: 20 }
];
```

### Personnalisation des listes
```typescript
// Ajouter des titres de tâches spécifiques
MockDataLists.TASK_TITLES.push(
  'Migrer vers microservices',
  'Implémenter GraphQL',
  'Optimiser le bundle Webpack'
);

// Domaines d'entreprise personnalisés
MockDataLists.COMPANY_DOMAINS.push(
  'startup', 'devlab', 'codeforge'
);
```

## Tests et développement

### Tests unitaires
```typescript
describe('MockDataGenerator', () => {
  beforeEach(() => {
    MockGeneratorUtils.setSeed(12345); // Seed fixe pour tests
  });

  it('should generate consistent users with same seed', () => {
    const user1 = MockDataGenerator.generateUser();
    MockGeneratorUtils.setSeed(12345); // Reset seed
    const user2 = MockDataGenerator.generateUser();
    
    expect(user1.firstName).toBe(user2.firstName);
    expect(user1.lastName).toBe(user2.lastName);
  });
});
```

### Démo et présentation
```typescript
// Données parfaites pour démo
MockGeneratorUtils.setSeed(777);
const demoDataset = MockDataGenerator.generateCohesiveDataset({
  userCount: 8,
  workspaceCount: 2,
  taskCount: 15,
  seed: 777
});
// → Toujours les mêmes données "parfaites" pour démo
```

## Performance

- **Génération rapide** : ~1ms par entité
- **Seed léger** : Algorithme LCG optimisé
- **Mémoire efficace** : Pas de cache global
- **Scalable** : Supporte 1000+ entités sans problème

## Extensibilité

### Nouveaux types d'entités
```typescript
export class MockDataGenerator {
  static generateProject(options?: ProjectOptions): Project {
    const rng = MockGeneratorUtils.getRng();
    // Implémentation...
  }
}
```

### Nouvelles listes de données
```typescript
export class MockDataLists {
  static readonly PROJECT_TYPES = [
    'Web Application', 'Mobile App', 'API Service', 'DevOps Tool'
  ];
  
  static readonly TECHNOLOGIES = [
    'Angular', 'React', 'Vue.js', 'Node.js', 'Python', 'Java'
  ];
}
```

Le générateur est conçu pour être facilement extensible tout en maintenant la cohérence et le réalisme des données générées.