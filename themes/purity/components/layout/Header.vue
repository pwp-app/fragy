<template>
  <div class="page-header">
    <div class="page-header-title">
      <div class="page-header-title-main" v-if="$route.path === '/'">
        <span>{{ title }}</span>
      </div>
      <a
        class="page-header-title-main page-header-title-main--clickable"
        :href="homeUrl"
        @click.prevent="goHome"
        v-else
      >
        <span>{{ title }}</span>
      </a>
      <div class="page-header-title-sub mobile-hide" v-if="subtitle">
        <span>{{ subtitle }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'fragy.purity.layout.header',
  data() {
    const { title, subtitle } = this.$fragy;

    return {
      title,
      subtitle,
      homeUrl: window.location.origin,
    };
  },
  methods: {
    goHome() {
      this.$router.push('/');
      document.title = this.$fragy.title;
    },
  },
};
</script>

<style lang="less">
@header-height: 3rem;

.page-header {
  user-select: none;
  margin-bottom: 2.25rem;
  height: @header-height;
  flex: 0 0 auto;
  &-title {
    display: flex;
    &-main {
      min-width: 5rem;
      height: @header-height;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: var(--text-title);
      font-size: 1.2rem;
      font-weight: 600;
      letter-spacing: 0.075rem;
      text-decoration: none;
    }
    &-main--clickable {
      transition: 100ms ease-in-out;
    }
    &-main--clickable:hover {
      background: var(--primary-hover);
      cursor: pointer;
    }
    &-main--clickable:active {
      color: var(--text-title);
    }
    &-main--clickable:visited {
      color: var(--text-title);
    }
    &-main--clickable:focus {
      color: var(--text-title);
    }
    &-sub {
      color: var(--text-subtitle);
      align-self: flex-end;
      font-size: 1.125rem;
      letter-spacing: 0.05rem;
      margin-left: 1.25rem;
    }
  }
}
</style>
